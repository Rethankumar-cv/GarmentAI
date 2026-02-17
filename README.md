# GarmentsInsights_AI 🚀

GarmentsInsights_AI is a cutting-edge, AI-powered analytics and management platform designed for the garment retail industry. It bridges the gap between boutique owners and customers by providing real-time inventory tracking, sales predictions, and a seamless e-commerce experience.

## 🌟 Key Features

### For Boutique Owners
*   **Predictive Analytics:** AI-driven sales forecasting using XGBoost and Scikit-learn to optimize inventory.
*   **Real-time Dashboard:** comprehensive overview of sales, revenue, and active orders.
*   **Inventory Management:** effortless product addition, stock tracking, and categorization.
*   **Order Management:** seamless order processing with dynamic status updates (Pending, Shipped, Delivered).
*   **Smart Recommendations:** data-backed insights on which products to restock or discount.

### For Customers
*   **Personalized Shopping:** smart product recommendations based on browsing history and trends.
*   **Interactive UI:** modern, responsive interface built with React 19 and Tailwind CSS.
*   **Order Tracking:** detailed real-time tracking of orders from purchase to delivery.
*   **Secure Authentication:** JWT-based secure login and registration.

### For Admins
*   **Centralized Control:** manage users, active sessions, and overall platform health.
*   **System Analytics:** high-level insights into platform usage and performance.

## 🛠️ Technology Stack

### Frontend
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS v4, Material UI (MUI) v7
*   **State Management:** Zustand
*   **Visualization:** Chart.js, React-Chartjs-2
*   **Maps:** Leaflet

### Backend
*   **Framework:** Django 5 (Python)
*   **API:** Django REST Framework (DRF)
*   **Database:** SQLite (Dev), PostgreSQL (Prod ready)
*   **Authentication:** JWT (SimpleJWT)
*   **AI Models:** Scikit-learn, XGBoost, Pandas, NumPy

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   Python 3.10+
*   Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Rethankumar-cv/GarmentAI.git
    cd GarmentAI
    ```

2.  **Backend Setup**
    ```bash
    # Create virtual environment
    python -m venv venv
    
    # Activate virtual environment
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Run migrations
    python manage.py migrate
    
    # Start server
    python manage.py runserver
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    
    # Install dependencies
    npm install
    
    # Start development server
    npm run dev
    ```

## 🤝 Contribution
Contributions are welcome! Please fork the repository and create a pull request.

## 📄 License
This project is licensed under the MIT License.
