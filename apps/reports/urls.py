from django.urls import path
from .views import sales_report

urlpatterns = [
    path("sales/", sales_report, name="sales-report"),
]
