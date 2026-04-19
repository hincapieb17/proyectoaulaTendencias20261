from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Customer.objects.all().order_by("id")

        return Customer.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user

        if Customer.objects.filter(user=user).exists():
            raise ValidationError("Este usuario ya tiene un perfil de cliente.")

        serializer.save(user=user)

    @action(detail=False, methods=["get"], url_path="profile")
    def profile(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            raise ValidationError("El usuario autenticado no tiene perfil de cliente.")

        serializer = self.get_serializer(customer)
        return Response(serializer.data)