import os
import django
import sys
import requests

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GarmentAI.settings")
django.setup()

from predictions.ml_service import ml
ml.initialize()

try:
    print("Testing ML compute elasticity...")
    res = ml.compute_price_elasticity('85123A', 2.55)
    print("Result:", res)
    
    print("\nTesting ML predict demand...")
    res2 = ml.predict_demand_for_product('85123A', 2.55, 1)
    print("Result:", res2)
except Exception as e:
    import traceback
    traceback.print_exc()

