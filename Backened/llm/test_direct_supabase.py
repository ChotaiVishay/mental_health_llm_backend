import httpx
import os

# Your Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "YOUR_SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Test 1: Direct query with % wildcard
print("=== Test 1: Search for Carlton with % wildcard ===")
pattern = "%carlton%"
params = {
    "select": "*",
    "or": f"suburb.ilike.{pattern},service_name.ilike.{pattern}",
    "limit": "5"
}

response = httpx.get(f"{SUPABASE_URL}/rest/v1/staging_services", headers=headers, params=params)
print(f"Status: {response.status_code}")
print(f"Params sent: {params}")
print(f"Results: {len(response.json())}")
if response.json():
    print(f"First result: {response.json()[0]}")
print()

# Test 2: Try without the OR, just suburb
print("=== Test 2: Simple suburb search ===")
params2 = {
    "select": "*",
    "suburb": "ilike.%carlton%",
    "limit": "5"
}

response2 = httpx.get(f"{SUPABASE_URL}/rest/v1/staging_services", headers=headers, params=params2)
print(f"Status: {response2.status_code}")
print(f"Params sent: {params2}")
print(f"Results: {len(response2.json())}")
if response2.json():
    print(f"First result: {response2.json()[0]}")
