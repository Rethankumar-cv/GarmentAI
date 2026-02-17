
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GarmentAI.settings')
django.setup()

from predictions.models import Product
from django.conf import settings

def map_images():
    # Mapping based on Inventory.jsx
    CATEGORY_MAP = {
        0: "Shirts", 
        1: "T-Shirts", 
        2: "Jeans", 
        3: "Jackets", 
        4: "Sweaters",
        5: "Dresses", 
        6: "Skirts", 
        7: "Sarees", 
        8: "Ethnic Wear", 
        9: "Casual Wear",
        10: "Formal Wear", 
        11: "Sports Wear", 
        12: "Others"
    }
    
    products = Product.objects.all()
    count = 0
    
    print(f"Found {products.count()} products to process.")
    
    for product in products:
        cat_id = product.garment_category
        cat_name = CATEGORY_MAP.get(cat_id)
        
        if not cat_name:
            print(f"[{product.name}] Unknown category ID: {cat_id}. Skipping.")
            continue
            
        # Construct expected filename
        filename = f"{cat_name}.jpg"
        
        # Check if file exists in MEDIA_ROOT
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        
        if os.path.exists(file_path):
            # Update image URL
            # Since files are in root of media, URL is /media/Filename.jpg
            product.image = f"/media/{filename}"
            product.save()
            print(f"[{product.name}] Updated image to: {product.image}")
            count += 1
        else:
            print(f"[{product.name}] Image file NOT FOUND: {file_path}")
            
    print(f"Successfully updated {count} products.")

if __name__ == '__main__':
    map_images()
