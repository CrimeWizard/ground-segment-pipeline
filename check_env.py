import os
from dotenv import load_dotenv

print("Checking environment variables from .env file...")

# Load variables from .env file in the current directory
load_dotenv()

client_id = os.getenv("SH_CLIENT_ID")
client_secret = os.getenv("SH_CLIENT_SECRET")
db_uri = os.getenv("DATABASE_URI")

print("\n--- Results ---")

if client_id:
    print(f"✅ SH_CLIENT_ID: Found (ends with '...{client_id[-4:]}')")
else:
    print("❌ SH_CLIENT_ID: Not found!")

if client_secret:
    # We don't print any part of the secret
    print(f"✅ SH_CLIENT_SECRET: Found (value is hidden for security)")
else:
    print("❌ SH_CLIENT_SECRET: Not found!")

if db_uri:
    print(f"✅ DATABASE_URI: Found ('{db_uri[:25]}...')")
else:
    print("❌ DATABASE_URI: Not found!")

print("\n--- Diagnosis ---")
if not client_id or not client_secret:
    print("Your Sentinel Hub credentials are NOT being loaded correctly.")
    print("Please double-check that:")
    print("1. Your .env file is in the same directory you are running this script from.")
    print("2. The variable names are spelled EXACTLY: SH_CLIENT_ID and SH_CLIENT_SECRET.")
    print("3. Your file is plain text and has no unusual formatting.")
else:
    print("Your environment variables appear to be loading correctly.")
