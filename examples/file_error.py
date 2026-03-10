import os
import sys

def read_config():
    # Intentional error: accessing a file that doesn't exist
    with open("non_existent_config.json", "r") as f:
        return f.read()

if __name__ == "__main__":
    print("Reading config...")
    read_config()
