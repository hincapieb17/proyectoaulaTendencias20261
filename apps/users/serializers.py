from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'role'] # Estos son los campos que quiero que se vean cuando alguien se registre
        extra_kwargs = {'password': {'write_only': True}} # Esto es para que la clave se pueda guardar pero no se vea en los resultados

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

# Uso create_user para que Django guarde la clave encriptada
# Si no lo uso, la clave se guarda como texto normal y no sirve el login