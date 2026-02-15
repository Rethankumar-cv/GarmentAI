from django.urls import path, include

urlpatterns = [
    # API
    path('api/', include('predictions.api_urls')),
]
