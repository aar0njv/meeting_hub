import os
import requests
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from vector_service import add_transcript_to_vector_db, search_vector_db

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

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
        
        if res.status_code != 200:
            print(f"❌ Google API Error {res.status_code}: {res.text}")
            res.raise_for_status()

        data = res.json()

        if 'candidates' not in data or 'content' not in data['candidates'][0]:
            print(f"⚠️ No content in response: {data}")
            return {} if force_json else "No response."

        raw_content = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        if force_json:
            # Clean up backticks if the model ignores our 'no backticks' instruction
            cleaned_json = raw_content.replace('```json', '').replace('```', '').strip()
            try:
                return json.loads(cleaned_json)
            except json.JSONDecodeError as e:
                print(f"❌ JSON Parse Error: {e}\nRaw content: {raw_content}")
                raise HTTPException(status_code=500, detail="Malformed JSON from AI")
        
        return raw_content

    except Exception as e:
        print(f"Internal Error in call_gemini: {e}")
        raise

@app.post("/analyze")
async def analyze_transcript(req: AnalyzeRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    
    system_prompt = """
    You are an expert meeting analyst. Extract:
    1. segments: 6-10 chronological parts with 'segment_index', 'topic', and 'vibe' (enthusiasm, agreement, neutral, frustration, conflict).
    2. focus_score: integer 0-100.
    3. decisions: list of strings.
    4. action_items: list of objects with 'owner', 'task', 'due_date'.
    5. sentiment: 'positive', 'neutral', or 'negative'.
    """
    
    try:
        # Truncate for safety
        safe_text = " ".join(req.transcript.split()[-25000:])
        return call_gemini(system_prompt, safe_text)
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
    context_text = ""
    sources = []
    
    if req.transcript_content:
        context_text = f"Source: Current Transcript\nContent: {req.transcript_content}"
        sources = ["Current Transcript"]
    else:
        search_results = search_vector_db(query=req.question, n_results=5, transcript_ids=req.transcript_ids)
        if search_results['documents'] and len(search_results['documents'][0]) > 0:
            context_pieces = []
            for doc, meta in zip(search_results['documents'][0], search_results['metadatas'][0]):
                filename = meta.get('filename', 'Unknown Source')
                context_pieces.append(f"Source: {filename}\nContent:\n{doc}")
            context_text = "\n\n---\n\n".join(context_pieces)
            sources = list(set(search_results['metadatas'][0][i]['filename'] for i in range(len(search_results['metadatas'][0]))))

    system_prompt = f"You are a helpful AI assistant. Answer the user's question based ONLY on the following context. In your response, you MUST explicitly cite the 'Source' (e.g., file name) from which you obtained the information. If you cannot find the answer in the context, say so.\n\nContext:\n{context_text}"
    
    try:
        answer = call_gemini(system_prompt, req.question, force_json=False)
        return {"answer": answer, "sources_used": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)