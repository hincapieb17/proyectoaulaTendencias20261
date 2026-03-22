from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


# Permiso personalizado por rol
class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'


# CATEGORY
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # todos pueden ver
        return [IsAdminRole()]  # solo admin modifica


# PRODUCT
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # todos pueden ver productos
        return [IsAdminRole()]  # solo admin crea/edita/elimina