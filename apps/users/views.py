from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UnifiedProfileSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UnifiedProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UnifiedProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user