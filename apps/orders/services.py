from django.core.exceptions import ValidationError
from django.db import transaction
from apps.products.models import Product


VALID_TRANSITIONS = {
    "draft": ["confirmed", "cancelled"],
    "confirmed": ["preparing", "cancelled"],
    "preparing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": [],
}


def validate_status_transition(current_status, new_status):
    allowed_transitions = VALID_TRANSITIONS.get(current_status, [])

    if new_status not in allowed_transitions:
        raise ValidationError(
            f"No se permite cambiar de '{current_status}' a '{new_status}'."
        )


@transaction.atomic
def confirm_order(order):
    if order.status != "draft":
        raise ValidationError("Solo los pedidos en borrador pueden confirmarse.")

    items = order.items.select_related("product").all()

    if not items.exists():
        raise ValidationError("No se puede confirmar un pedido sin ítems.")

    # Primero validar todo
    for item in items:
        product = Product.objects.select_for_update().get(pk=item.product.pk)

        if product.stock <= 0 or getattr(product, "status", "") == "agotado":
            raise ValidationError(f"El producto '{product.name}' está agotado.")

        if product.stock < item.quantity:
            raise ValidationError(
                f"No hay stock suficiente para '{product.name}'. "
                f"Disponible: {product.stock}, solicitado: {item.quantity}."
            )

    # Luego descontar
    for item in items:
        product = Product.objects.select_for_update().get(pk=item.product.pk)
        product.stock -= item.quantity
        product.save()

    order.status = "confirmed"
    order.calculate_totals()
    order.save()

    return order


@transaction.atomic
def cancel_order(order):
    if order.status not in ["draft", "confirmed", "preparing"]:
        raise ValidationError(
            "Solo se pueden cancelar pedidos en borrador, confirmados o en preparación."
        )

    if order.status in ["confirmed", "preparing"]:
        for item in order.items.select_related("product").all():
            product = Product.objects.select_for_update().get(pk=item.product.pk)
            product.stock += item.quantity
            product.save()

    order.status = "cancelled"
    order.save()

    return order


@transaction.atomic
def change_order_status(order, new_status):
    validate_status_transition(order.status, new_status)

    if new_status == "cancelled":
        return cancel_order(order)

    order.status = new_status
    order.save()

    return order