from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin ve todo
        if user.role == 'admin':
            return Customer.objects.all()

        # Cliente solo ve su info
        return Customer.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user

        # Evitar duplicados
        if Customer.objects.filter(user=user).exists():
            raise ValidationError("Este usuario ya tiene un perfil de cliente.")

        serializer.save(user=user)