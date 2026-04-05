import os
import requests
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from vector_service import add_transcript_to_vector_db, search_vector_db

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

app = FastAPI(title="Meeting Intelligence AI Service")

class AnalyzeRequest(BaseModel):
    transcript: str


class ChatRequest(BaseModel):
    question: str
    transcript_ids: list[str] | None = None
    transcript_content: str | None = None

class VectorizeRequest(BaseModel):
    transcript_id: str
    filename: str
    content: str


def call_gemini(system_prompt: str, user_text: str, force_json: bool = True):
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "parts": [{"text": user_text}]
        }]
    }
    
    if force_json:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }

    headers = {"Content-Type": "application/json"}
    
    try:
        res = requests.post(GEMINI_URL, headers=headers, json=payload)
        
        # 1. Catch HTTP errors (like 400, 404, 500)
        if res.status_code != 200:
            print(f"❌ Google API Error {res.status_code}: {res.text}")
            res.raise_for_status()

        data = res.json()

        # 2. Check if Gemini blocked the prompt (Safety Filters)
        # If 'content' is missing, it means the model refused to answer.
        if 'candidates' not in data or 'content' not in data['candidates'][0]:
            finish_reason = data.get('candidates', [{}])[0].get('finishReason', 'UNKNOWN')
            print(f"⚠️ Model blocked response. Reason: {finish_reason}")
            print(f"Full Response JSON: {json.dumps(data, indent=2)}")
            return "I'm sorry, I cannot answer that question based on the transcript content (Blocked by Safety Filters)."

        raw_content = data['candidates'][0]['content']['parts'][0]['text']
    
        if force_json:
            return json.loads(raw_content.strip())
        return raw_content.strip()

    except requests.exceptions.RequestException as e:
        print(f"Network Error calling Gemini: {e}")
        raise
    except Exception as e:
        print(f"Internal Error in call_gemini: {e}")
        raise

@app.post("/analyze")
async def analyze_transcript(req: AnalyzeRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    
    # NEW PROMPT: Combines everything including the chronological timeline segments
    system_prompt = """
    You are an expert meeting analyst. Analyze the provided transcript and extract information into a structured JSON format.
    
    1. Chronological Segments: Break the meeting into 6-10 logical parts. For each part, provide:
       - segment_index: (integer)
       - topic: (short description of what was discussed)
       - vibe: (Must be exactly one of: "enthusiasm", "agreement", "neutral", "frustration", or "conflict")

    2. Key Decisions: A list of specific agreements reached.
    3. Action Items: List of tasks with "owner", "task", and "due_date".
    4. Global Sentiment: Exactly one of: "positive", "neutral", or "negative".

    RESPONSE FORMAT (JSON ONLY):
    {
      "segments": [
        { "segment_index": 1, "topic": "Budget discussion", "vibe": "agreement" }
      ],
      "decisions": ["Allocated $5k for UI"],
      "action_items": [
        { "owner": "Alice", "task": "Create wireframes", "due_date": "Next Monday" }
      ],
      "sentiment": "positive"
    }
    """
    try:
        return call_gemini(system_prompt, req.transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/vectorize")
async def vectorize_transcript(req: VectorizeRequest):
    try:
        chunks_added = add_transcript_to_vector_db(req.transcript_id, req.filename, req.content)
        return {"status": "success", "chunks_added": chunks_added}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_transcript(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is empty")

    context_chunks = []
    
    if req.transcript_content:
        context_text = req.transcript_content
        sources = ["Provided Transcript"]
    else:
        try:
            search_results = search_vector_db(
                query=req.question, 
                n_results=7, 
                transcript_ids=req.transcript_ids
            )
            
            if search_results['documents'] and len(search_results['documents'][0]) > 0:
                docs = search_results['documents'][0]
                metadatas = search_results['metadatas'][0]
                for i in range(len(docs)):
                    context_chunks.append({
                        "text": docs[i], 
                        "filename": metadatas[i]["filename"]
                    })
            
            if not context_chunks:
                return {
                    "answer": "I could not find any relevant information in the transcripts.",
                    "sources_used": []
                }
                
            context_text = "\n\n".join([
                f"Source: {chunk['filename']}\nContent: {chunk['text']}"
                for chunk in context_chunks
            ])
            sources = list(set([chunk["filename"] for chunk in context_chunks]))
            
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Database search failed: {str(e)}")

    system_prompt = f"""
    You are an intelligent meeting assistant. Answer the user's question using ONLY the provided context from meeting transcripts.
    
    Context from transcripts:
    {context_text}
    
    Rules:
    1. If the answer is not in the context, say "I cannot find the answer to this in the uploaded transcripts." Do not make up information.
    """

    try:
        answer = call_gemini(system_prompt, req.question, force_json=False)
        return {
            "question": req.question,
            "answer": answer,
            "sources_used": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)