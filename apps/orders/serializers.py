from django.db import transaction
from rest_framework import serializers
from apps.products.models import Product
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]
        read_only_fields = ["id", "unit_price", "subtotal", "product_name"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_name",
            "status",
            "subtotal",
            "discount",
            "total",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "status",
            "subtotal",
            "discount",
            "total",
            "created_at",
            "updated_at",
        ]

    def validate_customer(self, value):
        request = self.context["request"]
        user = request.user

        if user.role == "admin":
            return value

        if value.user != user:
            raise serializers.ValidationError(
                "Solo puedes crear pedidos para tu propio perfil."
            )

        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("El pedido debe tener al menos un ítem.")

        product_ids = []
        for item in value:
            product = item.get("product")
            quantity = item.get("quantity")

            if not product:
                raise serializers.ValidationError("Todos los ítems deben tener producto.")

            if product.id in product_ids:
                raise serializers.ValidationError(
                    f"El producto '{product.name}' está repetido dentro del pedido."
                )
            product_ids.append(product.id)

            if quantity <= 0:
                raise serializers.ValidationError(
                    f"La cantidad del producto '{product.name}' debe ser mayor que cero."
                )

            # No permitir pedir productos agotados
            if product.stock <= 0 or getattr(product, "status", "") == "agotado":
                raise serializers.ValidationError(
                    f"El producto '{product.name}' está agotado y no se puede pedir."
                )

            # Validación extra desde creación
            if quantity > product.stock:
                raise serializers.ValidationError(
                    f"No hay suficiente stock para '{product.name}'. "
                    f"Disponible: {product.stock}, solicitado: {quantity}."
                )

        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        customer = validated_data["customer"]

        # Regla: no permitir crear otro pedido draft con productos repetidos del mismo cliente
        draft_orders = Order.objects.filter(customer=customer, status="draft").prefetch_related("items__product")

        requested_product_ids = [item["product"].id for item in items_data]

        for draft_order in draft_orders:
            existing_product_ids = list(
                draft_order.items.values_list("product_id", flat=True)
            )

            repeated = set(requested_product_ids) & set(existing_product_ids)
            if repeated:
                repeated_products = Product.objects.filter(id__in=repeated)
                repeated_names = ", ".join([p.name for p in repeated_products])
                raise serializers.ValidationError(
                    f"Ya tienes un pedido en borrador con estos productos: {repeated_names}."
                )

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]

            # Esto también protege contra productos inexistentes o inválidos
            if not Product.objects.filter(pk=product.pk).exists():
                raise serializers.ValidationError(
                    f"El producto con id {product.pk} no existe."
                )

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=product.price,
            )

        order.calculate_totals()
        order.save()

        return order


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["confirmed", "preparing", "shipped", "delivered", "cancelled"]
    )