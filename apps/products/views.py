from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


def is_safe_method(method):
    return method in ["GET", "HEAD", "OPTIONS"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer

    def get_permissions(self):
        if is_safe_method(self.request.method):
            return [IsAuthenticated()]
        return [IsAdminRole()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if is_safe_method(self.request.method):
            return [IsAuthenticated()]
        return [IsAdminRole()]