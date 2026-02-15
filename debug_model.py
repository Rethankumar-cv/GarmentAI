import joblib
import os
import sys

print(f"Current working directory: {os.getcwd()}")
if os.path.exists("GarmentAI_Model"):
    print("GarmentAI_Model found.")
    try:
        model = joblib.load("GarmentAI_Model")
        print("Model loaded successfully!")
    except Exception as e:
        print(f"FAILED TO LOAD MODEL: {e}")
        import traceback
        traceback.print_exc()
else:
    print("GarmentAI_Model NOT found.")
