import requests
import json

BASE_URL = "http://localhost:8000"

sample_transcript = """
John: We need to decide on the logo color. I suggest Blue.
Sarah: Blue works for me. I'll create the brand guidelines by Wednesday.
John: Great, Blue it is. Mark, please update the website header today.
"""

def test_analyze():
    print("\n--- Testing /analyze ---")
    payload = {"transcript": sample_transcript}
    response = requests.post(f"{BASE_URL}/analyze", json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_vectorize_and_chat():
    print("\n--- Testing /vectorize ---")
    vec_payload = {
        "transcript_id": "meeting_001",
        "filename": "branding_meeting.txt",
        "content": sample_transcript
    }
    vec_res = requests.post(f"{BASE_URL}/vectorize", json=vec_payload)
    print(f"Vectorize Status: {vec_res.status_code}")

    print("\n--- Testing /chat ---")
    chat_payload = {
        "question": "What color did the team decide on for the logo?",
        "transcript_id": "meeting_001"
    }
    chat_res = requests.post(f"{BASE_URL}/chat", json=chat_payload)
    print(f"Chat Status: {chat_res.status_code}")
    print(json.dumps(chat_res.json(), indent=2))

if __name__ == "__main__":
    try:
        test_analyze()
        test_vectorize_and_chat()
    except Exception as e:
        print(f"Test failed! Is your uvicorn server running? Error: {e}")