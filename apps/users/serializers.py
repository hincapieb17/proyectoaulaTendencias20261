from rest_framework import serializers
from .models import User
from apps.customers.models import Customer


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "password"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            role="cliente",
        )
        return user


class UnifiedProfileSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(read_only=True)

    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def to_representation(self, instance):
        user = instance
        customer = Customer.objects.filter(user=user).first()

        return {
            "username": user.username or "",
            "email": user.email or "",
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "role": user.role,
            "full_name": customer.full_name if customer else "",
            "phone": customer.phone if customer else "",
            "address": customer.address if customer else "",
        }

    def update(self, instance, validated_data):
        user = instance

        user.username = validated_data.get("username", user.username)
        user.email = validated_data.get("email", user.email)
        user.first_name = validated_data.get("first_name", user.first_name)
        user.last_name = validated_data.get("last_name", user.last_name)
        user.save()

        if user.role == "cliente":
            customer, created = Customer.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": validated_data.get("full_name", ""),
                    "phone": validated_data.get("phone", ""),
                    "address": validated_data.get("address", ""),
                    "email": user.email or "",
                },
            )

            if not created:
                customer.full_name = validated_data.get("full_name", customer.full_name)
                customer.phone = validated_data.get("phone", customer.phone)
                customer.address = validated_data.get("address", customer.address)
                customer.email = user.email or customer.email
                customer.save()

        return user