import requests
import random
import time
from datetime import datetime, timedelta

# API endpoint
BASE_URL = "http://localhost:8000"

# Sample data for realistic fake events
MODELS = [
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229", 
    "claude-3-haiku-20240307",
    "gpt-4-turbo-preview",
    "gpt-3.5-turbo",
    "gemini-pro"
]

PROMPTS = [
    "Explain quantum computing in simple terms",
    "What is the difference between machine learning and deep learning?",
    "How does TCP/IP networking work?",
    "Describe the SOLID principles in software engineering",
    "What is recursion and when should I use it?",
    "Explain REST API design best practices",
    "How do database indexes improve performance?",
    "What is the difference between authentication and authorization?",
    "Explain the CAP theorem in distributed systems",
    "How does garbage collection work in Python?",
    "What are the benefits of using Docker?",
    "Explain the difference between SQL and NoSQL databases",
    "How does HTTPS encryption work?",
    "What is the time complexity of quicksort?",
    "Explain what a closure is in JavaScript"
]

def generate_response(prompt):
    """Generate a fake response based on the prompt"""
    responses = [
        f"Here's a detailed explanation of {prompt.lower()}: ",
        f"Let me break down {prompt.lower()} for you: ",
        f"Great question! Regarding {prompt.lower()}: "
    ]
    base = random.choice(responses)
    # Add some lorem ipsum to make it realistic
    filler = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " * random.randint(5, 15)
    return base + filler

def generate_event():
    """Generate a single fake LLM event"""
    model = random.choice(MODELS)
    prompt = random.choice(PROMPTS)
    response = generate_response(prompt)
    
    # Realistic latency based on model
    if "opus" in model:
        latency = random.randint(2000, 5000)  # Opus is slower
    elif "haiku" in model:
        latency = random.randint(300, 800)    # Haiku is fastest
    elif "gpt-4" in model:
        latency = random.randint(1500, 4000)
    else:
        latency = random.randint(800, 2500)
    
    # Token usage roughly correlates with response length
    tokens = len(response.split()) + len(prompt.split())
    
    return {
        "model": model,
        "prompt": prompt,
        "response": response,
        "latency_ms": latency,
        "tokens_used": tokens
    }

def main():
    print(" LLM Monitor - Test Data Generator")
    print("=" * 50)
    
    # Check if API is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f" API is running: {response.json()['message']}\n")
    except requests.exceptions.ConnectionError:
        print(" Error: FastAPI server is not running!")
        print("   Please start it with: uvicorn main:app --reload")
        return
    
    # Ask how many events to generate
    try:
        num_events = int(input("How many fake events to generate? (default 50): ") or "50")
    except ValueError:
        num_events = 50
    
    print(f"\n Generating {num_events} fake LLM events...")
    print("-" * 50)
    
    success_count = 0
    fail_count = 0
    
    for i in range(num_events):
        event = generate_event()
        
        try:
            response = requests.post(f"{BASE_URL}/ingest", json=event)
            
            if response.status_code == 200:
                success_count += 1
                # Show progress every 10 events
                if (i + 1) % 10 == 0 or i == 0:
                    print(f" {i + 1}/{num_events} events sent ({success_count} successful)")
            else:
                fail_count += 1
                print(f" Event {i + 1} failed: {response.text}")
        
        except Exception as e:
            fail_count += 1
            print(f" Event {i + 1} error: {str(e)}")
        
        # Small delay to not overwhelm the API
        time.sleep(0.05)
    
    print("\n" + "=" * 50)
    print("Summary:")
    print(f"    Successful: {success_count}")
    print(f"    Failed: {fail_count}")
    print(f"    Total: {num_events}")
    
    # Fetch and display stats
    print("\n Fetching current stats from API...")
    try:
        stats = requests.get(f"{BASE_URL}/stats").json()
        print(f"   Total events in database: {stats['total_events']}")
        print(f"   Unique models: {stats['unique_models']}")
        print(f"   Average latency: {stats['avg_latency_ms']:.2f}ms")
        print(f"   Average tokens: {stats['avg_tokens']:.2f}")
        print(f"   Total estimated cost: ${stats['total_cost']:.6f}")
    except Exception as e:
        print(f"    Could not fetch stats: {str(e)}")
    
    print("\nDone! Your database now has realistic test data.")
    print(f"   View events at: {BASE_URL}/events")
    print(f"   View stats at: {BASE_URL}/stats")
    print(f"   API docs at: {BASE_URL}/docs")

if __name__ == "__main__":
    main()