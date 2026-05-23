from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Order, Return
from .serializers import (
    OrderSerializer,
    OrderStatusSerializer,
    ReturnCreateSerializer,
    ReturnSerializer,
)
from .services import (
    confirm_order,
    change_order_status,
    cancel_order,
    process_return,
)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        if user.role == "admin":
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.filter(customer__user=user)

        status_filter = params.get("status")
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return (
            queryset
            .prefetch_related("items__product", "customer__user")
            .order_by("-id")
        )

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()

        if request.user.role != "admin" and order.customer.user != request.user:
            raise ValidationError("No tienes permiso para confirmar este pedido.")

        try:
            confirm_order(order)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()

        if request.user.role != "admin" and order.customer.user != request.user:
            raise ValidationError("No tienes permiso para cancelar este pedido.")

        reason = request.data.get("reason", "")

        try:
            cancel_order(order, reason=reason)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        order = self.get_object()

        if request.user.role != "admin":
            raise ValidationError(
                "Solo el administrador puede cambiar el estado del pedido."
            )

        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        reason = request.data.get("reason", "")

        try:
            change_order_status(order, new_status, reason=reason)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get", "post"], url_path="returns")
    def returns(self, request, pk=None):
        order = self.get_object()

        if request.user.role != "admin" and order.customer.user != request.user:
            raise ValidationError(
                "No tienes permiso para acceder a las devoluciones de este pedido."
            )

        if request.method == "GET":
            order_returns = Return.objects.filter(order=order).prefetch_related(
                "items__order_item__product"
            )
            serializer = ReturnSerializer(order_returns, many=True)
            return Response(serializer.data)

        serializer = ReturnCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data["reason"]
        items_data = serializer.validated_data["items"]

        try:
            order_return = process_return(
                order=order,
                reason=reason,
                items_data=items_data,
            )
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        response_serializer = ReturnSerializer(order_return)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
