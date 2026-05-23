from datetime import date
from django.db.models import Sum, Count, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.orders.models import Order, OrderItem


def _parse_date(value, param_name):
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValidationError(f"'{param_name}' debe estar en formato YYYY-MM-DD.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_report(request):
    if request.user.role != "admin":
        raise ValidationError("Solo el administrador puede ver los reportes.")

    params = request.query_params
    start_raw = params.get("start_date")
    end_raw = params.get("end_date")

    filters = {}
    if start_raw:
        filters["created_at__date__gte"] = _parse_date(start_raw, "start_date")
    if end_raw:
        filters["created_at__date__lte"] = _parse_date(end_raw, "end_date")

    all_orders = Order.objects.filter(**filters)

    delivered_orders = all_orders.filter(status="delivered")
    total_sales = delivered_orders.aggregate(total=Sum("total"))["total"] or 0
    total_delivered = delivered_orders.count()

    orders_by_status = (
        all_orders.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    top_products = (
        OrderItem.objects.filter(
            order__status="delivered",
            **{f"order__{k}": v for k, v in filters.items()},
        )
        .values("product__name", "product__id")
        .annotate(total_quantity=Sum("quantity"), total_revenue=Sum("subtotal"))
        .order_by("-total_quantity")[:10]
    )

    top_customers = (
        delivered_orders.values("customer__full_name", "customer__id")
        .annotate(
            total_spent=Sum("total"),
            total_orders=Count("id"),
        )
        .order_by("-total_spent")[:10]
    )

    cancelled_orders = all_orders.filter(status="cancelled")
    cancelled_count = cancelled_orders.count()
    cancelled_list = list(
        cancelled_orders.values(
            "id",
            "cancellation_reason",
            "cancelled_at",
            customer_name=F("customer__full_name"),
        ).order_by("-cancelled_at")[:20]
    )

    return Response(
        {
            "period": {
                "start_date": start_raw,
                "end_date": end_raw,
            },
            "summary": {
                "total_sales": float(total_sales),
                "total_delivered_orders": total_delivered,
                "total_cancelled_orders": cancelled_count,
                "orders_by_status": list(orders_by_status),
            },
            "top_products": [
                {
                    "product_name": p["product__name"],
                    "product_id": p["product__id"],
                    "total_quantity": p["total_quantity"],
                    "total_revenue": float(p["total_revenue"] or 0),
                }
                for p in top_products
            ],
            "top_customers": [
                {
                    "customer_name": c["customer__full_name"],
                    "customer_id": c["customer__id"],
                    "total_spent": float(c["total_spent"] or 0),
                    "total_orders": c["total_orders"],
                }
                for c in top_customers
            ],
            "cancelled_orders": cancelled_list,
        }
    )
