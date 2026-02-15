from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import joblib
import pandas as pd
import numpy as np
import json
import random
from .models import UserProfile, Boutique, Product, Purchase

# ================= JSON SAFE =================
def make_json_safe(obj):
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(i) for i in obj]
    elif isinstance(obj, np.generic):
        return obj.item()
    return obj

# ================= LOAD MODEL =================
model = joblib.load("GarmentAI_Model")

SERVICE_LEVEL = 0.95
ORDER_COST = 500
HOLDING_COST_PERCENT = 0.12

# ================= MAPPINGS =================
garment_categories = {
    "Shirts": 0,
    "T-Shirts": 1,
    "Jeans": 2,
    "Jackets": 3,
    "Sweaters": 4,
    "Dresses": 5,
    "Skirts": 6,
    "Sarees": 7,
    "Ethnic Wear": 8,
    "Casual Wear": 9,
    "Formal Wear": 10,
    "Sports Wear": 11,
    "Others": 12
}

fabric_mapping = {
    "Cotton": 0,
    "Silk": 1,
    "Polyester": 2,
    "Wool": 0,
    "Linen": 1,
    "Others": 2,
    "1": 0,
    "2": 1,
    "Fat": 0,
    "Regular": 1
}

outlet_ids = {
    0:'OUT049',1:'OUT018',2:'OUT010',3:'OUT013',4:'OUT027',
    5:'OUT045',6:'OUT017',7:'OUT046',8:'OUT035',9:'OUT019'
}

outlet_geo = {
    0:("Delhi",28.61,77.20),1:("Mumbai",19.07,72.87),
    2:("Chennai",13.08,80.27),3:("Kolkata",22.57,88.36),
    4:("Bangalore",12.97,77.59),5:("Hyderabad",17.38,78.48),
    6:("Jaipur",26.91,75.78),7:("Ahmedabad",23.02,72.57),
    8:("Pune",18.52,73.85),9:("Surat",21.17,72.83)
}

# ================= AUTH =================
def auth_view(request):
    if request.method == "POST":
        if request.POST.get("action") == "login":
            user = authenticate(
                username=request.POST["username"],
                password=request.POST["password"]
            )
            if user:
                login(request, user)
                return redirect("predict")
            messages.error(request, "Invalid credentials")

        if request.POST.get("action") == "register":
            User.objects.create_user(
                username=request.POST["username"],
                email=request.POST["email"],
                password=request.POST["password"]
            )
            messages.success(request, "Registration successful")

    return render(request, "auth.html")

def logout_view(request):
    logout(request)
    return redirect("auth")

# ================= MAIN ENGINE =================
@login_required(login_url="auth")
def predict_sales(request):

    if request.method == "POST":

        # ================= INPUT MAPPING =================
        fabric_type = fabric_mapping.get(request.POST["fabric_type"], 2)
        garment_category = garment_categories.get(request.POST["garment_category"], 12)

        data = {
            "Item_Weight": float(request.POST["item_weight"]),
            "Item_Fat_Content": int(fabric_type),
            "Item_Visibility": round(random.uniform(0.005, 0.25), 3),

            "Item_Type": int(garment_category),
            "Item_MRP": float(request.POST["price"]),
            "Outlet_Identifier": int(request.POST["outlet_id"]),
            "Outlet_Establishment_Year": int(request.POST["outlet_established_year"]),
            "Outlet_Size": int(request.POST["outlet_size"]),
            "Outlet_Location_Type": int(request.POST["outlet_location_type"]),
            "Outlet_Type": int(request.POST["outlet_type"])
        }

        # ================= BASE ML =================
        base_monthly = float(model.predict(pd.DataFrame([data]))[0])
        base_annual = base_monthly * 12

        # ================= PRICE SENSITIVITY =================
        mrp_range = np.linspace(data["Item_MRP"] * 0.85, data["Item_MRP"] * 1.15, 12)
        sales_curve = []

        for p in mrp_range:
            temp = data.copy()
            temp["Item_MRP"] = p
            sales_curve.append(float(model.predict(pd.DataFrame([temp]))[0]) * 12)

        elasticity = np.polyfit(mrp_range, sales_curve, 1)[0]
        optimal_price = round(mrp_range[np.argmax(sales_curve)], 2)

        chart_data = json.dumps({
            "labels": [round(i,2) for i in mrp_range],
            "data": [round(i,2) for i in sales_curve]
        })

        # ================= FORECAST =================
        seasonality_strength = 0.08 + (abs(elasticity) * 0.15)
        seasonal_factors = [
            1 + seasonality_strength * np.sin(i + base_annual / 150000)
            for i in range(12)
        ]

        forecast = [
            round(base_annual * seasonal_factors[i] / sum(seasonal_factors), 2)
            for i in range(12)
        ]

        avg_monthly = np.mean(forecast)
        daily_sales = avg_monthly / 30

        # ================= SALES PATTERNS =================
        x = np.arange(12)
        slope = np.polyfit(x, forecast, 1)[0]
        momentum = (np.mean(forecast[-3:]) - np.mean(forecast[:3])) / max(avg_monthly,1)
        volatility_ratio = np.std(forecast) / max(avg_monthly,1)

        if slope > 0.07 and momentum > 0.05:
            trend = "Strong Upward"
        elif slope > 0.02:
            trend = "Mild Upward"
        elif slope < -0.07 and momentum < -0.05:
            trend = "Strong Downward"
        elif slope < -0.02:
            trend = "Mild Downward"
        else:
            trend = "Stable"

        if volatility_ratio > 0.30:
            seasonality = "Very High"
        elif volatility_ratio > 0.18:
            seasonality = "High"
        elif volatility_ratio > 0.10:
            seasonality = "Moderate"
        else:
            seasonality = "Low"

        sales_patterns = {
            "trend": trend,
            "seasonality": seasonality,
            "volatility": round(volatility_ratio * 100, 2),
            "interpretation": (
                f"Sales show a {trend.lower()} trend with {seasonality.lower()} seasonality, "
                "requiring adaptive planning." if volatility_ratio > 0.15 else
                "Sales are stable and predictable."
            )
        }

        # ================= DEMAND PLANNING =================
        demand_intensity = (avg_monthly / max(np.median(forecast),1)) * (1 + abs(slope))
        forecast_confidence = max(0.3, 1 - volatility_ratio)

        demand_planning = {
            "avg_monthly_demand": round(avg_monthly,2),
            "annual_demand": round(sum(forecast),2),
            "forecast_confidence": round(forecast_confidence,2)
        }

        # ================= INVENTORY =================
        lead_time = 14
        z = 1.65
        safety_stock = z * np.std(forecast)/30 * np.sqrt(lead_time)
        reorder_point = daily_sales * lead_time + safety_stock

        eoq = np.sqrt(
            (2 * sum(forecast) * ORDER_COST) /
            (data["Item_MRP"] * HOLDING_COST_PERCENT)
        )

        inventory_intelligence = {
            "daily_sales": round(daily_sales,2),
            "safety_stock": round(safety_stock,2),
            "reorder_point": round(reorder_point,2),
            "economic_order_quantity": round(eoq,2),
            "stockout_risk": "High" if safety_stock > daily_sales*7 else "Low"
        }

        auto_reorder = {
            "reorder_required": reorder_point > avg_monthly*0.8,
            "recommended_order_qty": round(eoq,2)
        }

        # ================= DISCOUNT =================
        recommended_discount = round(min(abs(elasticity)*10,30),2)
        discount_strategy = {
            "recommended_discount_percent": recommended_discount,
            "best_discount_months": ["Apr","May"] if recommended_discount > 0 else []
        }

        # ================= GEO =================
        city,lat,lng = outlet_geo[data["Outlet_Identifier"]]
        geo_intelligence = {"city":city,"lat":lat,"lng":lng}

        # ================= PRICING =================
        pricing_optimization = {
            "current_price": data["Item_MRP"],
            "optimal_price": optimal_price,
            "price_elasticity": round(elasticity,4)
        }

        # ================= RECOMMENDATIONS =================
        recommendations = [
            "Align pricing with elasticity insights for garments",
            "Adjust replenishment based on garment forecasts",
            "Use promotions strategically for high-demand fabrics",
            "Maintain optimal inventory levels for each garment type"
        ]


        modules = {
            "forecast": forecast,
            "sales_patterns": sales_patterns,
            "pricing_optimization": pricing_optimization,
            "demand_planning": demand_planning,
            "inventory_intelligence": inventory_intelligence,
            "auto_reorder": auto_reorder,
            "discount_strategy": discount_strategy,
            "geo_intelligence": geo_intelligence,
            "recommendations": recommendations
        }

        # ================= STORE FOR MODULE PAGES =================
        request.session["modules"] = make_json_safe(modules)
        request.session["chart_data"] = chart_data
        request.session["prediction"] = round(sum(forecast),2)

        return redirect("sales_patterns")

    return render(request,"predict.html",{
        "item_types": garment_categories,
        "outlet_ids": outlet_ids
    })

# ================= MODULE VIEWS =================
# All your other module views (sales_patterns_view, forecast_view, decision_support_view,
# inventory_view, recommendations_view, geo_map_view) remain unchanged,
# because they operate on `request.session["modules"]`
# and will work seamlessly with this garment-mapped input.


# ================= MODULE VIEWS =================
@login_required
def sales_patterns_view(request):

    modules = request.session.get("modules")

    if not modules:
        return redirect("predict")  # force proper flow

    patterns = modules.get("sales_patterns", {})
    chart_data = json.loads(request.session.get("chart_data", "{}"))


    raw_volatility = float(patterns.get("volatility", 0))
    volatility = max(0, min(raw_volatility, 100))

    if volatility < 20:
        risk_level = "Low Risk"
        risk_color = "success"
    elif volatility < 50:
        risk_level = "Moderate Risk"
        risk_color = "warning"
    else:
        risk_level = "High Risk"
        risk_color = "danger"

    volatility_score = round(volatility / 100, 2)
    confidence_score = round(100 - volatility, 1)

    recommendations = []

    trend = patterns.get("trend", "Stable")
    seasonality = patterns.get("seasonality", "Low")

    # ---- Volatility driven ----
    if volatility < 20:
        recommendations.append(
            "Sales are stable. Maintain current pricing and inventory strategy."
        )
    elif volatility < 50:
        recommendations.append(
            "Moderate fluctuations detected. Monitor demand weekly and adjust safety stock."
        )
    else:
        recommendations.append(
            "High volatility detected. Use short-term forecasts and flexible replenishment."
        )

    # ---- Trend driven ----
    if "Upward" in trend:
        recommendations.append(
            "Upward sales trend identified. Prepare inventory scaling and capacity planning."
        )
    elif "Downward" in trend:
        recommendations.append(
            "Downward trend detected. Review pricing, promotions, and product positioning."
        )
    else:
        recommendations.append(
            "Sales trend is stable. Focus on operational efficiency."
        )

    # ---- Seasonality driven ----
    if seasonality in ["High", "Very High"]:
        recommendations.append(
            "Strong seasonality present. Align promotions and inventory with peak months."
        )
    elif seasonality == "Moderate":
        recommendations.append(
            "Moderate seasonality detected. Maintain adaptive forecasting."
        )
    else:
        recommendations.append(
            "Low seasonality. Long-term planning is reliable."
        )

    # ---- Confidence driven ----
    if confidence_score < 60:
        recommendations.append(
            "Forecast confidence is low. Reduce planning horizon and increase monitoring."
        )
    else:
        recommendations.append(
            "Forecast confidence is strong. Strategic planning can be extended."
        )

    # ✅ ADD THIS (KEY FIX)
    request.session["modules"]["recommendations"] = recommendations

    return render(request, "sales_patterns.html", {
        "patterns": patterns,
        "chart_data": json.dumps(chart_data),
        "volatility": volatility,
        "volatility_score": volatility_score,
        "confidence_score": confidence_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "recommendations": recommendations,
    })


@login_required
def forecast_view(request):
    """
    forecast → list of 12 numeric values (monthly forecast)
    stored dynamically based on user input / ML model
    """

    modules = request.session.get("modules")

    if not modules:
        return redirect("predict")

    forecast = modules.get("forecast", [])


    if not forecast:
        forecast = [0] * 12   # safe fallback

    # ====== PYTHON SIDE CALCULATIONS (ACCURATE) ======
    total_sales = round(sum(forecast), 2)
    avg_monthly = round(total_sales / len(forecast), 2)
    peak_sales = round(max(forecast), 2)
    peak_month_index = forecast.index(max(forecast))

    months = ["Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec"]

    peak_month = months[peak_month_index]

    return render(request, "forecast.html", {
        # raw data
        "forecast_json": json.dumps(forecast),

        # KPIs
        "total_sales": total_sales,
        "avg_monthly": avg_monthly,
        "peak_sales": peak_sales,
        "peak_month": peak_month,
    })


@login_required
def decision_support_view(request):

    modules = request.session.get("modules", {})

    pricing = modules.get("pricing_optimization", {})
    demand = modules.get("demand_planning", {})
    discount = modules.get("discount_strategy", {})

    # ===== SAFE FALLBACKS =====
    pricing.setdefault("current_price", 0)
    pricing.setdefault("optimal_price", 0)
    pricing.setdefault("price_elasticity", 0)

    demand.setdefault("avg_monthly_demand", 0)
    demand.setdefault("annual_demand", 0)
    demand.setdefault("forecast_confidence", 0)

    discount.setdefault("recommended_discount_percent", 0)
    discount.setdefault("best_discount_months", [])

    # ===== CHART DATA =====
    price_chart = {
        "labels": ["Current Price", "Optimal Price"],
        "values": [
            pricing["current_price"],
            pricing["optimal_price"]
        ]
    }

    confidence_chart = {
        "labels": ["Confidence", "Uncertainty"],
        "values": [
            demand["forecast_confidence"] * 100,
            100 - (demand["forecast_confidence"] * 100)
        ]
    }

    return render(request, "decision_support.html", {
        "pricing": pricing,
        "demand": demand,
        "discount": discount,
        "price_chart": price_chart,
        "confidence_chart": confidence_chart,
    })


@login_required
def inventory_view(request):

    modules = request.session.get("modules")

    if not modules:
        return redirect("predict")

    inventory = modules.get("inventory_intelligence", {})
    auto_reorder = modules.get("auto_reorder", {})


    # ================= STOCK HEALTH =================
    reorder_point = inventory.get("reorder_point", 1)
    current_stock = inventory.get("current_stock", reorder_point)

    stock_health = min(100, round((current_stock / max(reorder_point,1)) * 100))

    # ================= RISK COLOR =================
    if stock_health < 40:
        risk_color = "danger"
    elif stock_health < 70:
        risk_color = "warning"
    else:
        risk_color = "success"

    # ================= AI RECOMMENDATIONS (DYNAMIC) =================
    recommendations = []

    if stock_health < 40:
        recommendations.append("Immediate reorder required to avoid stockout")
    if inventory["safety_stock"] < inventory["daily_sales"] * 5:
        recommendations.append("Increase safety stock due to demand volatility")
    if inventory["economic_order_quantity"] > inventory["reorder_point"]:
        recommendations.append("EOQ is higher than reorder point — optimize order cycle")
    if stock_health > 80:
        recommendations.append("Inventory health is strong — maintain current policy")

    if not recommendations:
        recommendations.append("Inventory parameters are balanced and optimal")

    # ================= CHART DATA =================
    chart_data = {
        "labels": ["Safety Stock", "Reorder Point", "EOQ"],
        "values": [
            inventory["safety_stock"],
            inventory["reorder_point"],
            inventory["economic_order_quantity"]
        ]
    }

    return render(request, "inventory.html", {
        # KPI values
        "daily_sales": inventory["daily_sales"],
        "safety_stock": inventory["safety_stock"],
        "reorder_point": inventory["reorder_point"],
        "eoq": inventory["economic_order_quantity"],

        # Stock intelligence
        "stock_health": stock_health,
        "risk_color": risk_color,

        # Decisions
        "inventory": inventory,
        "auto_reorder": auto_reorder,

        # Dynamic outputs
        "recommendations": recommendations,
        "chart_json": json.dumps(chart_data),
    })


@login_required
def recommendations_view(request):

    modules = request.session.get("modules", {})

    sales_patterns = modules.get("sales_patterns", {})
    pricing = modules.get("pricing_optimization", {})
    inventory = modules.get("inventory_intelligence", {})
    demand = modules.get("demand_planning", {})
    discount = modules.get("discount_strategy", {})

    recommendations = []
    impact_scores = []

    # ================= SALES TREND =================
    trend = sales_patterns.get("trend", "Stable")
    volatility = float(sales_patterns.get("volatility", 0))

    if "Upward" in trend:
        recommendations.append(
            "Increase inventory capacity to support sustained demand growth."
        )
        impact_scores.append(min(90, 70 + volatility))
    elif "Downward" in trend:
        recommendations.append(
            "Re-evaluate pricing and reduce excess inventory exposure."
        )
        impact_scores.append(max(40, 80 - volatility))
    else:
        recommendations.append(
            "Sales are stable. Focus on cost efficiency and operational optimization."
        )
        impact_scores.append(65)

    # ================= PRICING =================
    current_price = pricing.get("current_price", 0)
    optimal_price = pricing.get("optimal_price", current_price)

    if optimal_price > current_price * 1.03:
        recommendations.append(
            "There is room to increase price without hurting demand."
        )
        impact_scores.append(75)
    elif optimal_price < current_price * 0.97:
        recommendations.append(
            "Reducing price slightly may significantly improve sales volume."
        )
        impact_scores.append(80)
    else:
        recommendations.append(
            "Current pricing is close to optimal. Maintain price stability."
        )
        impact_scores.append(60)

    # ================= INVENTORY =================
    safety_stock = inventory.get("safety_stock", 0)
    daily_sales = inventory.get("daily_sales", 1)

    if safety_stock < daily_sales * 5:
        recommendations.append(
            "Increase safety stock to protect against demand fluctuations."
        )
        impact_scores.append(85)
    else:
        recommendations.append(
            "Inventory buffers are sufficient. Maintain current reorder strategy."
        )
        impact_scores.append(65)

    # ================= DEMAND CONFIDENCE =================
    forecast_confidence = demand.get("forecast_confidence", 0.5) * 100

    if forecast_confidence < 60:
        recommendations.append(
            "Forecast reliability is low. Shorten planning cycles and monitor demand weekly."
        )
        impact_scores.append(90)
    else:
        recommendations.append(
            "Forecast confidence is strong. Long-term planning is reliable."
        )
        impact_scores.append(70)

    # ================= DISCOUNT STRATEGY =================
    discount_percent = discount.get("recommended_discount_percent", 0)

    if discount_percent > 15:
        recommendations.append(
            "Apply targeted promotions during high elasticity periods to boost revenue."
        )
        impact_scores.append(80)
    elif discount_percent > 0:
        recommendations.append(
            "Use limited-time discounts to stimulate demand without margin loss."
        )
        impact_scores.append(65)

    # ================= FINAL SANITY =================
    impact_scores = [min(100, max(10, int(v))) for v in impact_scores]

    chart_data = {
        "labels": [f"Action {i+1}" for i in range(len(recommendations))],
        "data": impact_scores
    }

    return render(request, "recommendations.html", {
        "recommendations": recommendations,
        "chart_data": json.dumps(chart_data)
    })

@login_required
def geo_map_view(request):

    modules = request.session.get("modules", {})
    geo = modules.get("geo_intelligence", {})

    # SAFE FALLBACKS
    city = geo.get("city", "Unknown Location")
    lat = float(geo.get("lat", 20.5937))   # Default India center
    lng = float(geo.get("lng", 78.9629))

    map_data = {
        "city": city,
        "lat": lat,
        "lng": lng
    }

    return render(request, "geo_map.html", {
        "geo": geo,
        "map_data": json.dumps(map_data)
    })

from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import redirect, render

def owner_register(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        email = request.POST.get("email", "")
        outlet_id = int(request.POST["outlet_id"])
        boutique_name = request.POST["boutique_name"]
        city = request.POST["city"]

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose a different one.")
            return render(request, "owner/register.html")

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )

        UserProfile.objects.create(
            user=user,
            role="OWNER",
            outlet_id=outlet_id
        )

        Boutique.objects.create(
            outlet_id=outlet_id,
            name=boutique_name,
            city=city,
            owner=user
        )

        login(request, user)
        return redirect("owner_dashboard")

    return render(request, "owner/register.html")

def owner_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(username=username, password=password)
        if user:
            # Ensure user is an OWNER
            try:
                if user.userprofile.role == "OWNER":
                    login(request, user)
                    return redirect("owner_dashboard")
                else:
                    messages.error(request, "You are not registered as a boutique owner.")
            except UserProfile.DoesNotExist:
                messages.error(request, "User profile not found.")
        else:
            messages.error(request, "Invalid credentials")
    return render(request, "owner/owner_login.html")

@login_required
def owner_logout(request):
    logout(request)
    return redirect("owner_login")

from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from datetime import timedelta

@login_required
def owner_dashboard(request):
    profile = request.user.userprofile
    outlet_id = profile.outlet_id

    boutique = get_object_or_404(Boutique, outlet_id=outlet_id)
    purchases = Purchase.objects.filter(outlet_id=outlet_id)

    # ================= BASIC KPIs =================
    total_revenue = purchases.aggregate(Sum("total_price"))["total_price__sum"] or 0
    total_orders = purchases.count()
    total_customers = purchases.values("customer").distinct().count()
    aov = purchases.aggregate(avg=Avg("total_price"))["avg"] or 0

    repeat_customers = (
        purchases.values("customer")
        .annotate(order_count=Count("id"))
        .filter(order_count__gt=1)
        .count()
    )

    # ================= SALES OVER TIME =================
    last_30_days = timezone.now() - timedelta(days=30)

    sales_over_time = (
        purchases.filter(created_at__gte=last_30_days)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(
            revenue=Sum("total_price"),
            orders=Count("id")
        )
        .order_by("date")
    )

    # Convert for Chart.js
    chart_labels = [s["date"].strftime("%d %b") for s in sales_over_time]
    chart_revenue = [float(s["revenue"]) for s in sales_over_time]
    chart_orders = [s["orders"] for s in sales_over_time]

    # ================= PRODUCT PERFORMANCE =================
    top_products = (
        purchases.values("product__name")
        .annotate(
            units_sold=Sum("quantity"),
            revenue=Sum("total_price")
        )
        .order_by("-revenue")[:5]
    )

    # ================= AI / ML MODULES =================
    modules = request.session.get("modules", {})
    sales_patterns = modules.get("sales_patterns", {
        "trend": "Stable",
        "seasonality": "Moderate",
        "volatility": 12
    })

    return render(request, "owner/dashboard.html", {
        "boutique": boutique,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "repeat_customers": repeat_customers,
        "aov": round(aov, 2),
        "top_products": top_products,
        "chart_labels": chart_labels,
        "chart_revenue": chart_revenue,
        "chart_orders": chart_orders,
        "sales_patterns": sales_patterns,
    })


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Count, Avg, Min, Max

@login_required
def owner_products(request):
    outlet_id = request.user.userprofile.outlet_id

    # ================= ADD PRODUCT =================
    if request.method == "POST":
        Product.objects.create(
            outlet_id=outlet_id,
            name=request.POST["name"].strip(),
            garment_category=garment_categories[request.POST["category"]],
            fabric_type=fabric_mapping[request.POST["fabric"]],
            price=float(request.POST["price"]),
            stock=int(request.POST["stock"])
        )
        messages.success(request, "Product added successfully")
        return redirect("owner_products")

    # ================= FILTERS =================
    search = request.GET.get("search", "")
    category = request.GET.get("category", "")

    products = Product.objects.filter(outlet_id=outlet_id)

    if search:
        products = products.filter(name__icontains=search)

    if category:
        products = products.filter(
            garment_category=garment_categories.get(category)
        )

    # ================= ANALYTICS =================
    total_products = products.count()
    low_stock = products.filter(stock__lt=10, stock__gt=0).count()
    out_of_stock = products.filter(stock=0).count()
    avg_price = products.aggregate(avg=Avg("price"))["avg"] or 0

    # Category distribution
    category_chart = (
        products.values("garment_category")
        .annotate(count=Count("id"))
    )

    category_labels = [
        k for k, v in garment_categories.items()
        if v in [c["garment_category"] for c in category_chart]
    ]

    category_data = [c["count"] for c in category_chart]

    # Price stats
    price_stats = products.aggregate(
        min=Min("price"),
        max=Max("price")
    )

    return render(request, "owner/products.html", {
        "products": products,
        "categories": garment_categories,
        "fabrics": fabric_mapping,
        "search": search,
        "selected_category": category,

        # analytics
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "avg_price": round(avg_price, 2),

        # charts
        "category_labels": category_labels,
        "category_data": category_data,
        "price_stats": price_stats,
    })


from django.db.models import Sum, Count

@login_required
def owner_customers(request):
    outlet_id = request.user.userprofile.outlet_id

    customers = (
        Purchase.objects
        .filter(outlet_id=outlet_id)
        .values("customer__username")
        .annotate(
            total_orders=Count("id"),
            total_spent=Sum("total_price")
        )
        .order_by("-total_spent")
    )

    total_customers = customers.count()
    high_value = customers.filter(total_spent__gt=5000).count()

    # ================= CHART DATA =================
    chart_labels = [c["customer__username"] for c in customers[:5]]
    chart_data = [float(c["total_spent"]) for c in customers[:5]]

    # ================= MODULES (KEEP) =================
    modules = request.session.get("modules", {})
    recommendations = modules.get("recommendations", [])

    # ================= DYNAMIC AI (FALLBACK) =================
    if not recommendations:  # if [] or None
        recommendations = []

        if total_customers == 0:
            recommendations.append("No customer data available yet")
        else:
            avg_spent = sum(c["total_spent"] for c in customers) / total_customers
            repeat_customers = customers.filter(total_orders__gt=1).count()

            if high_value > 0:
                recommendations.append(
                    f"{high_value} high-value customers contribute most revenue"
                )

            if repeat_customers / total_customers < 0.4:
                recommendations.append(
                    "Low repeat purchase rate — introduce loyalty rewards"
                )
            else:
                recommendations.append(
                    "Strong customer retention — focus on premium products"
                )

            if avg_spent < 1500:
                recommendations.append(
                    "Average spending is low — consider bundle pricing"
                )
            else:
                recommendations.append(
                    "Customers spend well — upsell premium collections"
                )

            top_customer = customers.first()
            if top_customer and top_customer["total_spent"] > 8000:
                recommendations.append(
                    f"{top_customer['customer__username']} is a VIP — offer exclusive deals"
                )

    # ================= RENDER =================
    return render(request, "owner/customers.html", {
        "customers": customers,
        "total_customers": total_customers,
        "high_value": high_value,
        "chart_labels": chart_labels,
        "chart_data": chart_data,
        "recommendations": recommendations,
    })



@login_required
def owner_inventory(request):
    outlet_id = request.user.userprofile.outlet_id
    products = Product.objects.filter(outlet_id=outlet_id)

    purchases = Purchase.objects.filter(outlet_id=outlet_id)

    # ================= SALES PER PRODUCT =================
    sales_map = (
        purchases
        .values("product_id")
        .annotate(qty=Count("id"))
    )

    sales_dict = {s["product_id"]: s["qty"] for s in sales_map}

    # ================= METRICS =================
    total_stock = sum(p.stock for p in products)
    total_sales = purchases.count()
    avg_daily_sales = round(total_sales / 30, 2) if total_sales else 0

    safety_stock = int(avg_daily_sales * 7)
    reorder_point = int(avg_daily_sales * 14)
    eoq = int((avg_daily_sales * 365) ** 0.5) if avg_daily_sales else 0

    # ================= RISK =================
    if total_stock <= reorder_point:
        stockout_risk = "High"
    elif total_stock <= reorder_point * 1.5:
        stockout_risk = "Medium"
    else:
        stockout_risk = "Low"

    # ================= DEAD + FAST PRODUCTS =================
    dead_stock = []
    fast_moving = []
    reorder_alerts = []

    for p in products:
        sold = sales_dict.get(p.id, 0)

        if sold == 0 and p.stock > 0:
            dead_stock.append(p)

        if sold >= avg_daily_sales * 5:
            fast_moving.append(p)

        if p.stock <= reorder_point:
            reorder_alerts.append(p)

    # ================= TREND CHART =================
    trend_labels = []
    trend_data = []

    for i in range(6):
        trend_labels.append(f"{i+1}M ago")
        trend_data.append(
            purchases.filter(created_at__month=((timezone.now().month - i - 1) % 12) + 1).count()
        )

    trend_labels.reverse()
    trend_data.reverse()

    inventory = {
        "daily_sales": avg_daily_sales,
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "economic_order_quantity": eoq,
        "stockout_risk": stockout_risk
    }

    return render(request, "owner/inventory.html", {
        "products": products,
        "inventory": inventory,
        "dead_stock": dead_stock,
        "fast_moving": fast_moving,
        "reorder_alerts": reorder_alerts,
        "trend_labels": trend_labels,
        "trend_data": trend_data,
    })


@login_required
def owner_predictions(request):
    return redirect("predict")



# CUSTOMER ROLE VIEWS CAN BE ADDED HERE

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Product, Purchase, Boutique

def customer_register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken")
            return redirect("customer_register")

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user, role="CUSTOMER")
        login(request, user)
        return redirect("customer_dashboard")

    return render(request, "customer/register.html")

def customer_login(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(username=username, password=password)
        if user and hasattr(user, "userprofile") and user.userprofile.role == "CUSTOMER":
            login(request, user)
            return redirect("customer_dashboard")
        messages.error(request, "Invalid credentials")
        return redirect("customer_login")

    return render(request, "customer/login.html")

def customer_logout(request):
    logout(request)
    return redirect("customer_login")

from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.shortcuts import render
from .models import Product, Purchase

from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.utils import timezone
from datetime import date

@login_required
def customer_dashboard(request):
    user = request.user
    today = date.today()

    # -------------------
    # Filter purchases for today
    # -------------------
    product_agg = (
        Purchase.objects.filter(customer=user, created_at__date=today)
        .values('product__id', 'product__name', 'product__garment_category')
        .annotate(
            total_quantity=Sum('quantity'),
            total_spent=Sum('total_price')
        )
        .order_by('-total_spent')
    )

    # Table purchases: aggregated
    purchases_table = product_agg

    # -------------------
    # Chart data: products vs total spent
    # -------------------
    if product_agg.exists():
        spending_labels = [p['product__name'] for p in product_agg]
        spending_data = [float(p['total_spent']) for p in product_agg]
    else:
        spending_labels = ['No Purchases']
        spending_data = [0]

    # -------------------
    # Category chart
    # -------------------
    category_agg = (
        Purchase.objects.filter(customer=user, created_at__date=today)
        .values('product__garment_category')
        .annotate(total_spent=Sum('total_price'))
        .order_by('-total_spent')
    )

    if category_agg.exists():
        category_labels = [c['product__garment_category'] for c in category_agg]
        category_data = [float(c['total_spent']) for c in category_agg]
    else:
        category_labels = ['None']
        category_data = [0]

    # -------------------
    # Top category for suggestions
    # -------------------
    top_category = category_agg[0]['product__garment_category'] if category_agg else None

    suggested_products = Product.objects.filter(garment_category=top_category).exclude(
        id__in=[p['product__id'] for p in product_agg]
    )[:6] if top_category else Product.objects.all()[:6]

    # -------------------
    # Dynamic AI Recommendations
    # -------------------
    recommendations = []

    total_orders = sum(p['total_quantity'] for p in product_agg)
    total_spent = sum(p['total_spent'] for p in product_agg)

    if total_orders > 0:
        recommendations.append(f"You have placed {total_orders} item(s) today.")
        recommendations.append(f"Total spent today: ₹{total_spent:.2f}.")
        if top_category:
            recommendations.append(f"Your favorite category today: {top_category}")
        if any(p['total_quantity'] >= 5 for p in product_agg):
            recommendations.append("You tend to buy multiple units of some products today. Check similar items!")
    else:
        recommendations.append("No purchases today. Start shopping to get personalized recommendations!")
        recommendations.append("Check out trending products in our collection!")

    return render(request, "customer/dashboard.html", {
        "purchases": purchases_table,
        "spending_labels": spending_labels,
        "spending_data": spending_data,
        "category_labels": category_labels,
        "category_data": category_data,
        "suggested_products": suggested_products,
        "top_category": top_category,
        "recommendations": recommendations,
        "total_spent": total_spent
    })

from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import Product, Purchase
from django.db.models import Sum

@login_required
def product_list(request):
    user = request.user
    products = Product.objects.all().order_by('name')

    user_purchases = Purchase.objects.filter(customer=user)
    purchased_product_ids = user_purchases.values_list('product_id', flat=True)

    # Reverse mapping dictionaries
    reverse_garment = {
        0: "Shirts", 1: "T-Shirts", 2: "Jeans", 3: "Jackets",
        4: "Sweaters", 5: "Dresses", 6: "Skirts", 7: "Sarees",
        8: "Ethnic Wear", 9: "Casual Wear", 10: "Formal Wear",
        11: "Sports Wear", 12: "Others"
    }

    reverse_fabric = {
        0: "Cotton",   # or "Wool/Fat" if multiple values in db
        1: "Silk",     # or "Linen/Regular"
        2: "Polyester" # or "Others"
    }

    low_stock_threshold = 10
    product_stats = []

    for p in products:
        # Stock
        if p.stock == 0:
            stock_status = 'Out of Stock'
            badge_class = 'bg-danger text-white'
        elif p.stock < low_stock_threshold:
            stock_status = f'Low ({p.stock})'
            badge_class = 'bg-warning text-dark'
        else:
            stock_status = f'{p.stock}'
            badge_class = 'bg-success text-white'

        # Map category/fabric numbers to names
        garment_name = reverse_garment.get(p.garment_category, "Unknown")
        fabric_name = reverse_fabric.get(p.fabric_type, "Unknown")

        product_stats.append({
            'product': p,
            'garment_name': garment_name,
            'fabric_name': fabric_name,
            'stock_status': stock_status,
            'badge_class': badge_class,
            'purchased': p.id in purchased_product_ids
        })

    return render(request, "customer/products.html", {
        "product_stats": product_stats,
    })


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Product, Purchase

# Reverse mappings for display
GARMENT_CATEGORIES = {
    0: "Shirts", 1: "T-Shirts", 2: "Jeans", 3: "Jackets",
    4: "Sweaters", 5: "Dresses", 6: "Skirts", 7: "Sarees",
    8: "Ethnic Wear", 9: "Casual Wear", 10: "Formal Wear",
    11: "Sports Wear", 12: "Others"
}

FABRIC_MAPPING = {
    0: "Cotton",
    1: "Silk",
    2: "Polyester"
}


@login_required
def add_to_cart(request, product_id):
    cart = request.session.get("cart", {})
    cart[str(product_id)] = cart.get(str(product_id), 0) + 1
    request.session["cart"] = cart
    messages.success(request, "Added to cart!")
    return redirect("cart_view")


@login_required
def remove_from_cart(request, product_id):
    cart = request.session.get("cart", {})
    if str(product_id) in cart:
        del cart[str(product_id)]
        request.session["cart"] = cart
        messages.success(request, "Removed from cart!")
    return redirect("cart_view")


@login_required
def cart_view(request):
    cart = request.session.get("cart", {})
    products = Product.objects.filter(id__in=cart.keys())

    cart_items = []
    total_price = 0

    for product in products:
        qty = cart[str(product.id)]
        subtotal = product.price * qty
        total_price += subtotal

        cart_items.append({
            "product": product,
            "quantity": qty,
            "subtotal": subtotal,
            "garment_name": GARMENT_CATEGORIES.get(product.garment_category, "Unknown"),
            "fabric_name": FABRIC_MAPPING.get(product.fabric_type, "Unknown"),
            "max_stock": product.stock
        })

    return render(request, "customer/cart.html", {
        "cart_items": cart_items,
        "total_price": total_price
    })


@login_required
def place_order(request):
    cart = request.session.get("cart", {})
    user = request.user

    if not cart:
        messages.error(request, "Your cart is empty")
        return redirect("product_list")

    for product_id, qty in cart.items():
        product = Product.objects.get(id=product_id)
        total_price = product.price * qty
        Purchase.objects.create(
            customer=user,
            product=product,
            outlet_id=product.outlet_id,
            quantity=qty,
            total_price=total_price
        )
        # Reduce stock
        product.stock = max(product.stock - qty, 0)
        product.save()

    request.session["cart"] = {}
    messages.success(request, "Order placed successfully!")
    return redirect("customer_dashboard")


@login_required
def customer_recommendations(request):
    user = request.user

    # ---------------------------
    # Purchase History
    # ---------------------------
    purchases = Purchase.objects.filter(customer=user).select_related('product')
    purchase_history = []

    for p in purchases:
        try:
            boutique = Boutique.objects.get(outlet_id=p.outlet_id)
            boutique_name = boutique.name
            boutique_city = boutique.city
        except Boutique.DoesNotExist:
            boutique_name = "Unknown Boutique"
            boutique_city = "Unknown City"

        purchase_history.append({
            "product_name": p.product.name,
            "garment_name": GARMENT_CATEGORIES.get(p.product.garment_category, "Unknown"),
            "fabric_name": FABRIC_MAPPING.get(p.product.fabric_type, "Unknown"),
            "quantity": p.quantity,
            "total_price": p.total_price,
            "boutique_name": boutique_name,
            "boutique_city": boutique_city,
            "purchase_date": p.created_at,
            "stock": p.product.stock,
            "stock_status": "Out of Stock" if p.product.stock == 0 else f"In Stock ({p.product.stock})",
            "badge_class": "bg-danger" if p.product.stock == 0 else "bg-success",
        })

    # ---------------------------
    # Recommendations
    # ---------------------------
    top_categories = purchases.values("product__garment_category") \
                              .annotate(total_qty=Sum("quantity")) \
                              .order_by("-total_qty")[:3]

    purchased_product_ids = [p.product.id for p in purchases]

    recommended_products = Product.objects.filter(
        garment_category__in=[c["product__garment_category"] for c in top_categories]
    ).exclude(id__in=purchased_product_ids)[:12]

    recommended_list = []
    for p in recommended_products:
        recommended_list.append({
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "garment_name": GARMENT_CATEGORIES.get(p.garment_category, "Unknown"),
            "fabric_name": FABRIC_MAPPING.get(p.fabric_type, "Unknown"),
            "stock": p.stock,
            "stock_status": "Out of Stock" if p.stock == 0 else f"In Stock ({p.stock})",
            "badge_class": "bg-danger" if p.stock == 0 else "bg-success",
            "already_purchased": p.id in purchased_product_ids
        })

    return render(request, "customer/recommendations.html", {
        "recommended_products": recommended_list,
        "purchase_history": purchase_history
    })
