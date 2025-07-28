#!/usr/bin/env python3

import requests
import json

# Test the template states endpoint
base_url = "http://localhost:8001"

# Login first
login_data = {
    "email": "admin@example.com",
    "password": "admin123"
}

try:
    # Get token
    login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test get all template states
        print("\nTesting GET /api/units/1/template-states")
        response = requests.get(f"{base_url}/api/units/1/template-states", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test get specific template state
        print("\nTesting GET /api/units/1/template-states/naval-card-standard")
        response = requests.get(f"{base_url}/api/units/1/template-states/naval-card-standard", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test save template state
        print("\nTesting POST /api/units/1/template-states/naval-card-standard")
        template_data = {
            "element_states": {"element1": {"x": 100, "y": 200}},
            "canvas_config": {"width": 800, "height": 600}
        }
        response = requests.post(f"{base_url}/api/units/1/template-states/naval-card-standard", 
                               json=template_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    else:
        print(f"Login failed: {login_response.text}")

except Exception as e:
    print(f"Error: {e}")