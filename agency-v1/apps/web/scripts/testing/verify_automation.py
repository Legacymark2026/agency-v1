import requests
import json
import sys

# Change this to your local server URL
BASE_URL = "http://localhost:3000"
API_KEY = "dev-key-123" # Default dev key

def test_automation_api():
    print("--- 🤖 Testing Automation API (Secured) ---")

    endpoint = f"{BASE_URL}/api/automation/trigger"
    
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "type": "FORM_SUBMISSION",
        "data": {
            "email": "secured@example.com",
            "name": "Secured User",
            "message": "Hello from secure world"
        }
    }

    try:
        print(f"POST {endpoint}")
        print(f"Headers: x-api-key=***")
        
        response = requests.post(endpoint, json=payload, headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
             print("❌ Unauthorized (Check API Key)")
             return

        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get("success"):
                print("✅ API Call Successful")
            else:
                print("❌ API Call Failed")
                
        except json.JSONDecodeError:
            print(f"Response (Text): {response.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_automation_api()
