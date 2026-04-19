from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer

#Uso esta clase de Django que ya hace casi todo el trabajo de crear objetos
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    #Le pongo AllowAny porque si no nadie podria registrarse sin estar logueado
    permission_classes = [AllowAny]