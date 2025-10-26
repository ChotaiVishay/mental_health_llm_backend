"""
Generate embeddings for all services using httpx (matching your existing codebase).
This avoids the supabase library version issues.
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI
import httpx

print("="*60)
print("  MENTAL HEALTH SERVICES - EMBEDDING GENERATION")
print("="*60)

# Load environment
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

# Validate config
print("\n✓ Checking configuration...")
if not OPENAI_API_KEY:
    print("❌ ERROR: OPENAI_API_KEY not found in .env")
    sys.exit(1)
if not SUPABASE_URL:
    print("❌ ERROR: SUPABASE_URL not found in .env")
    sys.exit(1)
if not SUPABASE_KEY:
    print("❌ ERROR: SUPABASE_KEY not found in .env")
    sys.exit(1)

print("✓ Configuration validated")

# Initialize clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
http_client = httpx.Client(timeout=30.0)

def get_headers():
    """Get Supabase REST API headers."""
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def create_embedding_text(service):
    """Create rich text representation for embedding."""
    parts = []
    
    # Core service info
    if service.get('service_name'):
        parts.append(f"Service: {service['service_name']}")
    if service.get('organisation_name'):
        parts.append(f"Organization: {service['organisation_name']}")
    if service.get('service_type'):
        parts.append(f"Type: {service['service_type']}")
    
    # Location
    location_parts = []
    if service.get('suburb'):
        location_parts.append(service['suburb'])
    if service.get('state'):
        location_parts.append(service['state'])
    if service.get('postcode'):
        location_parts.append(service['postcode'])
    if location_parts:
        parts.append(f"Location: {', '.join(location_parts)}")
    
    # Details
    if service.get('cost'):
        parts.append(f"Cost: {service['cost']}")
    if service.get('delivery_method'):
        parts.append(f"Delivery: {service['delivery_method']}")
    if service.get('target_population'):
        parts.append(f"Target: {service['target_population']}")
    if service.get('level_of_care'):
        parts.append(f"Care Level: {service['level_of_care']}")
    if service.get('notes'):
        notes = service['notes'][:200]
        parts.append(f"Notes: {notes}")
    
    return " | ".join(parts)

def get_embedding(text):
    """Generate embedding using OpenAI."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# Fetch all services
print("\n🔄 Fetching services from Supabase...")
try:
    url = f"{SUPABASE_URL}/rest/v1/staging_services"
    params = {"select": "*"}
    
    response = http_client.get(url, headers=get_headers(), params=params)
    response.raise_for_status()
    services = response.json()
    
    print(f"✓ Found {len(services)} services")
except Exception as e:
    print(f"❌ ERROR fetching services: {e}")
    sys.exit(1)

if not services:
    print("⚠️  No services found in database")
    sys.exit(0)

# Check existing embeddings
services_with_embeddings = sum(1 for s in services if s.get('embedding') is not None)
services_without = len(services) - services_with_embeddings

print(f"\n📊 Status:")
print(f"   Total services: {len(services)}")
print(f"   Already embedded: {services_with_embeddings}")
print(f"   Need embedding: {services_without}")

if services_without == 0:
    print("\n✅ All services already have embeddings!")
    sys.exit(0)

# Confirm
print(f"\nThis will generate embeddings for {services_without} services.")
print(f"Estimated cost: ~${services_without * 0.00002:.4f} (OpenAI API)")
confirm = input("\nContinue? (yes/no): ").strip().lower()

if confirm not in ['yes', 'y']:
    print("❌ Cancelled")
    sys.exit(0)

# Process services
print("\n" + "-"*60)
print("Starting embedding generation...\n")

successful = 0
failed = 0
skipped = 0
update_url = f"{SUPABASE_URL}/rest/v1/staging_services"

for idx, service in enumerate(services, 1):
    service_id = service.get('id')
    service_name = service.get('service_name', 'Unknown')
    
    try:
        # Skip if already has embedding
        if service.get('embedding') is not None:
            skipped += 1
            continue
        
        # Create text and generate embedding
        embed_text = create_embedding_text(service)
        embedding = get_embedding(embed_text)
        
        # Update in Supabase using httpx
        update_response = http_client.patch(
            update_url,
            headers=get_headers(),
            params={"id": f"eq.{service_id}"},
            json={"embedding": embedding}
        )
        update_response.raise_for_status()
        
        successful += 1
        
        # Progress updates
        if idx % 10 == 0 or idx == len(services):
            print(f"✓ [{idx}/{len(services)}] Processed | Success: {successful} | Skipped: {skipped} | Failed: {failed}")
            
    except Exception as e:
        failed += 1
        print(f"✗ [{idx}/{len(services)}] ERROR on '{service_name}': {e}")

# Final summary
print("\n" + "-"*60)
print("\n📊 FINAL SUMMARY:")
print(f"   Total services: {len(services)}")
print(f"   ✓ Successfully embedded: {successful}")
print(f"   ⊘ Already had embeddings: {skipped}")
print(f"   ✗ Failed: {failed}")

if failed > 0:
    print(f"\n⚠️  {failed} services failed to embed. Check errors above.")
else:
    print("\n✅ All services processed successfully!")

print("\n" + "="*60 + "\n")

# Cleanup
http_client.close()