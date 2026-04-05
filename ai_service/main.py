import os
import requests
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from vector_service import add_transcript_to_vector_db, search_transcripts, search_meeting_transcripts

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

app = FastAPI(title="Meeting Intelligence AI Service")

class AnalyzeRequest(BaseModel):
    transcript: str

class SentimentRequest(BaseModel):
    transcript: str

class ChatRequest(BaseModel):
    question: str
    transcript_id: str | None = None
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
    
    res = requests.post(GEMINI_URL, headers=headers, json=payload)
    res.raise_for_status()

    raw_content = res.json()['candidates'][0]['content']['parts'][0]['text']
    
    if force_json:
        return json.loads(raw_content.strip())
    else:
        return raw_content.strip()


@app.post("/analyze")
async def analyze_transcript(req: AnalyzeRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    
    system_prompt = """
    You are an expert meeting assistant. Analyze the following meeting transcript.
    Extract the key decisions made, the action items assigned, and the overall sentiment of the meeting.
    
    You MUST respond with a valid JSON object in this exact format:
    {
      "decisions": [
        "The team agreed to deploy the new UI on Friday."
      ],
      "action_items": [
        {
          "owner": "John Doe",
          "task": "Update schema",
          "due_date": "Next Tuesday"
        }
      ],
      "sentiment": "positive"
    }
    
    The "sentiment" field MUST be exactly one of: "positive", "negative", or "neutral".
    """
    try:
        return call_gemini(system_prompt, req.transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sentiment")
async def analyze_sentiment(req: SentimentRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
        
    system_prompt = """
    You are an expert behavioral analyst. Analyze the tone and sentiment of the meeting.
    
    1. Break down the chronological segments.
    2. Analyze the overall sentiment of each speaker.
    
    You MUST respond with a valid JSON object in this exact format:
    {
      "segments": [
        {
          "segment_index": 1,
          "topic": "Project Timeline",
          "vibe": "conflict" 
        }
      ],
      "speakers": [
        {
          "speaker": "Alice",
          "overall_vibe": "enthusiasm",
          "alignment": "Strongly supported new direction."
        }
      ]
    }
    Valid vibes are strictly: "agreement", "conflict", "frustration", "enthusiasm", or "neutral".
    """
    try:
        return call_gemini(system_prompt, req.transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vectorize")
async def vectorize_transcript(req: VectorizeRequest):
    """Store transcript in ChromaDB for chat retrieval."""
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
            search_results = search_transcripts(
                query=req.question, 
                n_results=5, 
                transcript_id=req.transcript_id
            )
            
            if search_results['documents'] and len(search_results['documents'][0]) > 0:
                docs = search_results['documents'][0]
                metadatas = search_results['metadatas'][0]
                for i in range(len(docs)):
                    context_chunks.append({"text": docs[i], "filename": metadatas[i]["filename"]})
            
            if not context_chunks:
                return {"answer": "I could not find any relevant information in the transcripts.", "sources_used": []}
                
            context_text = "\n\n".join([f"Source: {chunk['filename']}\nContent: {chunk['text']}" for chunk in context_chunks])
            sources = list(set([chunk["filename"] for chunk in context_chunks]))
            
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Database search failed: {str(e)}")

    system_prompt = f"""
    You are an intelligent meeting assistant. Answer the user's question using ONLY the provided context from meeting transcripts.
    
    Context from transcripts:
    {context_text}
    
    Rules:
    1. If the answer is not in the context, say "I cannot find the answer to this in the uploaded transcripts." Do not make up information.
    2. You MUST cite your sources inside brackets, e.g., (Source: file_name).
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