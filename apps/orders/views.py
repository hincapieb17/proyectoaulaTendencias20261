from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Order
from .serializers import OrderSerializer, OrderStatusSerializer
from .services import confirm_order, change_order_status


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

        if user.role == "admin":
            return Order.objects.all().prefetch_related("items__product", "customer__user").order_by("-id")

        return Order.objects.filter(
            customer__user=user
        ).prefetch_related("items__product", "customer__user").order_by("-id")

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()

        # Si el usuario es cliente, solo puede confirmar sus propios pedidos draft
        if request.user.role != "admin" and order.customer.user != request.user:
            raise ValidationError("No tienes permiso para confirmar este pedido.")

        try:
            confirm_order(order)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        order = self.get_object()

        # Solo admin puede cambiar estados manualmente
        if request.user.role != "admin":
            raise ValidationError("Solo el administrador puede cambiar el estado del pedido.")

        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]

        try:
            change_order_status(order, new_status)
        except DjangoValidationError as e:
            raise ValidationError(e.messages)

        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)