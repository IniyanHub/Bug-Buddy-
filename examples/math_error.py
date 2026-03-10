def calculate_sum(a, b):
    return a + b

def main():
    print("Running math app...")
    # Intentional error: calling with wrong number of arguments
    result = calculate_sum(10)
    print(f"Result: {result}")

if __name__ == "__main__":
    main()
