from sentinelhub import DataCollection

print("--- Available Sentinel Hub DataCollections ---")

# Iterate through the attributes of the DataCollection enum and print them
count = 0
for item in dir(DataCollection):
    # Filter out private/magic methods
    if not item.startswith('_'):
        # Also filter out methods or other callables
        if not callable(getattr(DataCollection, item)):
            print(f"- {item}")
            count += 1

print(f"
Found {count} available collections.")

# Explicitly check for the one we are trying to use
if hasattr(DataCollection, 'SENTINEL1_GRD'):
    print("
✅ 'SENTINEL1_GRD' was found.")
else:
    print("
❌ 'SENTINEL1_GRD' was NOT found.")
    print("
Please use one of the names from the list above in the script.")
