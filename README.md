# GarmentsInsights_AI 🚀

GarmentsInsights_AI is a cutting-edge, end-to-end AI-powered predictive analytics and management platform designed specifically for the garment retail industry. It provides boutique owners with deep insights into their inventory and sales through an advanced MLOps pipeline while offering customers a personalized, modern e-commerce experience.

## 🌟 Key Features

### For Boutique Owners
*   **Predictive Analytics:** AI-driven sales forecasting utilizing custom-trained XGBoost and Scikit-learn models to optimize inventory across different geographic outlets.
*   **Price Elasticity & Discounting:** Automated recommendations on markdown strategies and optimal pricing to clear stock while maximizing revenue.
*   **Inventory Intelligence:** Calculates Reorder Points (ROP), Economic Order Quantity (EOQ), and Safety Stock levels, sending alerts when inventory is critically low.
*   **Smart Product Recommendations:** Suggests bundle pairings based on historical transaction datasets and user similarity matrices.
*   **Real-time Dashboard:** A comprehensive, interactive overview of sales, predicted revenue, and active orders.

### For Customers
*   **Interactive E-commerce UI:** Modern, responsive interface built with React 19, Tailwind CSS v4, and Material UI (MUI).
*   **Personalized Shopping:** Smart recommendations based on the highest trending products and calculated garment similarities.
*   **Real-Time Order Tracking:** Detailed tracking of orders from purchase through to shipping and delivery.
*   **Secure Authentication:** Secure, JWT-based login and registration system differentiating Customers from Boutique Owners.

### For Admin & MLOps Engineers
*   **Centralized MLOps Dashboard:** A dedicated interface to monitor the health of the machine learning pipeline.
*   **Data Drift Detection:** Automatically compares live analytic snapshots against baselines to trigger alerts if data distributions shift significantly.
*   **Centralized Alert Manager:** Captures and logs pipeline failures, S3 synchronization issues, and schema validation errors.
*   **Model Registry:** Tracks the active versions of Demand, Elasticity, and Recommendation models with RMSE and MAE metrics.

---

## 🏗️ Architecture & Technology Stack

### Frontend (Client-Side)
*   **Framework:** React 19 (via Vite)
*   **Styling:** Tailwind CSS v4, Material UI (MUI)
*   **State Management:** Zustand
*   **Data Visualization:** Chart.js, React-Chartjs-2
*   **Routing:** React Router DOM v7

### Backend (Server-Side)
*   **Framework:** Django 5 (Python)
*   **API Architecture:** Django REST Framework (DRF)
*   **Database:** SQLite (Development) / PostgreSQL-ready (Production)
*   **Authentication:** SimpleJWT (JSON Web Tokens)
*   **Task Scheduling:** Background processing for ET pipelines

### Machine Learning & Data Pipeline
*   **Core Libraries:** Scikit-learn, XGBoost, Pandas, NumPy, Joblib
*   **Cloud Storage:** AWS S3 (for remote dataset hosting, model registry, and snapshot backups)
*   **Validation:** Schema enforcement through Python assertions before analytic files are generated

---

## 🧠 The MLOps Pipeline

The core of GarmentsInsights_AI is its robust, 8-phase data pipeline built to handle large e-commerce transaction sets (e.g., the UCI Online Retail II dataset):

1.  **Data Extraction:** Ingests raw `.csv` or `.xlsx` transactional data.
2.  **Transformation & Cleaning:** Removes cancellations, cleans negative quantities, drops missing customer IDs, and normalizes nomenclature.
3.  **Feature Engineering:** Creates 4 distinct analytical datasets:
    *   `product_demand.csv`: Monthly sales aggregates and momentum.
    *   `pricing_signals.csv`: Price volatility and revenue generation.
    *   `customer_segments.csv`: Recency, Frequency, Monetary (RFM) clustering.
    *   `inventory_metrics.csv`: Restock rates and stockout indicators.
4.  **Data Validation:** Hard schema checks utilizing Python assertions to ensure data integrity before ML consumption.
5.  **Analytics Export:** Saves processed datasets locally and syncs to a centralized S3 bucket.
6.  **Model Training:** Automatically triggers `train_demand.py`, `train_elasticity.py`, and `train_recommender.py` utilizing the new engineered features.
7.  **Model Registry:** Saves `.pkl` files and uploads them into the S3 bucket to simulate an active Model Registry environment.
8.  **Monitoring & Alerting (`alert_manager.py` / `data_drift.py`):** Calculates statistical changes in live vs. baseline data. Flags if data drift exceeds 25% and relays alerts directly into the Admin MLOps Dashboard.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+) & npm
*   Python 3.10+
*   Git

### 1. Clone the repository
```bash
git clone https://github.com/Rethankumar-cv/GarmentAI.git
cd GarmentAI
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# (Optional) Generate the large datasets from source
python data_pipeline/convert_dataset.py
python data_pipeline/pipeline.py

# Start the Django server (defaults to http://127.0.0.1:8000)
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server (defaults to http://localhost:5173)
npm run dev
```

### 4. Admin Access
To access the Admin and MLOps dashboards, create a superuser:
```bash
python manage.py createsuperuser
```
Then log in via the `/admin` portal or the frontend admin login route.

---

## 🗂️ Project Structure

```text
GarmentsInsights_AI/
├── analytics/             # Processed datasets (CSV)
├── data/                  # Raw Excel/CSV source files
├── data_pipeline/         # ETL, Feature Engineering, S3 Scripts
├── frontend/              # React 19 Frontend Application
├── ml_monitoring/         # Drift detection & Alert Manager
├── model_training/        # Scikit-learn/XGBoost training scripts
├── models/                # Serialized model (.pkl) outputs
├── monitoring/            # Drift snapshots & local alert logs
├── predictions/           # Django App: Views, Models, Serializers, ML Services
├── GarmentAI/             # Django Core settings & routing
└── manage.py              # Django CLI entry point
```

---

## 🤝 Contribution
Contributions are welcome! Please fork the repository, create a new branch for your feature, and submit a pull request.

## 📄 License
This project is licensed under the MIT License.
