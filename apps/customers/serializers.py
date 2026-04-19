from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "username",
            "role",
            "full_name",
            "phone",
            "address",
            "created_at",
        ]
        read_only_fields = ["id", "username", "role", "created_at"]