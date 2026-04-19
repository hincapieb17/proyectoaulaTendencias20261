from django.db import models
from django.conf import settings

class Customer(models.Model):
    # Conectamos el perfil con el modelo de usuario definido en settings
    # OneToOneField = un solo perfil por cada cuenta de usuario
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    full_name = models.CharField(max_length=150) 
    email = models.EmailField(unique=True) 
    phone = models.CharField(max_length=20) 
    address = models.CharField(max_length=255) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"