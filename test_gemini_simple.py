import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONITOR_URL = "http://localhost:8000/ingest"

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file")
    exit(1)

questions = [
    "What is FastAPI?",
    "Explain REST APIs in one sentence",
    "What is PostgreSQL?",
]

print(" Testing Gemini API with monitoring\n")

for i, question in enumerate(questions, 1):
    print(f"[{i}/{len(questions)}] Asking: {question}")
    
    try:
        start = time.time()
        
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
            json={
                "contents": [{
                    "parts": [{"text": question}]
                }]
            }
        )
        
        latency_ms = int((time.time() - start) * 1000)
        
        if response.status_code == 200:
            result = response.json()
            answer = result['candidates'][0]['content']['parts'][0]['text']
            tokens = len(question + answer) // 4
            
            requests.post(MONITOR_URL, json={
                "model": "gemini-1.5-flash",
                "prompt": question,
                "response": answer[:500],
                "latency_ms": latency_ms,
                "tokens_used": tokens,
                "estimated_cost": (tokens / 1000) * 0.0001
            })
            
            print(f"    {latency_ms}ms | {tokens} tokens")
            print(f"    Answer: {answer[:80]}...\n")
        else:
            print(f"    Error {response.status_code}: {response.text}\n")
            
    except Exception as e:
        print(f"    Error: {e}\n")
    
    time.sleep(3)

print("\n Done! Check your dashboard at http://localhost:3000")
