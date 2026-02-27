import os, django, sys, traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GarmentAI.settings")
django.setup()

from predictions.ml_service import ml
ml.initialize()

with open('debug_ml_trace.txt', 'w', encoding='utf-8') as f:
    try:
        f.write("Testing ML compute elasticity...\n")
        res = ml.compute_price_elasticity('85123A', 2.55)
        f.write(f"Result: {res}\n")
        
        f.write("\nTesting ML predict demand...\n")
        res2 = ml.predict_demand_for_product('85123A', 2.55, 1)
        f.write(f"Result: {res2}\n")
    except Exception as e:
        traceback.print_exc(file=f)
