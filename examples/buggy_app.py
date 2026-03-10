import request
import sys

def main():
    print("Starting buggy application...")
    # This will fail because 'request' is not the correct name (should be 'requests')
    # and even 'requests' might not be installed in the container by default.
    # But the agent should detect the ModuleNotFoundError.
    response = request.get("https://api.github.com")
    print(f"Status: {response.status_code}")

if __name__ == "__main__":
    main()
