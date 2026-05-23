from django.core.exceptions import ValidationError
from django.db import transaction
from apps.products.models import Product
from django.db.models import Sum
from .models import Return, ReturnItem, OrderItem


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
def cancel_order(order, reason=None):
    if order.status not in ["draft", "confirmed", "preparing"]:
        raise ValidationError(
            "Solo se pueden cancelar pedidos en borrador, confirmados o en preparación."
        )

    if order.status in ["confirmed", "preparing"]:
        for item in order.items.select_related("product").all():
            product = Product.objects.select_for_update().get(pk=item.product.pk)
            product.stock += item.quantity
            product.save()

    from django.utils import timezone

    order.status = "cancelled"
    order.cancellation_reason = reason or ""
    order.cancelled_at = timezone.now()
    order.save()

    return order


@transaction.atomic
def change_order_status(order, new_status, reason=None):
    validate_status_transition(order.status, new_status)

    if new_status == "cancelled":
        return cancel_order(order, reason=reason)

    order.status = new_status
    order.save()

    return order


@transaction.atomic
def process_return(order, reason, items_data):
    """
    Procesa una devolución parcial o total de un pedido entregado.

    Reglas:
    - Solo se pueden devolver pedidos en estado delivered.
    - No se puede devolver más cantidad de la comprada.
    - No se puede devolver más cantidad si ya hubo devoluciones anteriores.
    - El stock se reintegra automáticamente.
    """

    if order.status != "delivered":
        raise ValidationError(
            "Solo se pueden registrar devoluciones sobre pedidos entregados."
        )

    if not reason or not str(reason).strip():
        raise ValidationError("Debe ingresar un motivo para la devolución.")

    if not items_data:
        raise ValidationError("Debe enviar al menos un ítem para devolver.")

    order_return = Return.objects.create(
        order=order,
        reason=reason
    )

    for item_data in items_data:
        order_item_id = item_data.get("order_item")
        quantity = item_data.get("quantity")

        if not order_item_id:
            raise ValidationError("Cada ítem debe incluir el campo order_item.")

        if quantity is None:
            raise ValidationError("Cada ítem debe incluir el campo quantity.")

        if int(quantity) <= 0:
            raise ValidationError("La cantidad a devolver debe ser mayor que cero.")

        try:
            order_item = OrderItem.objects.select_related("product", "order").get(
                id=order_item_id,
                order=order
            )
        except OrderItem.DoesNotExist:
            raise ValidationError(
                f"El ítem con id {order_item_id} no pertenece a este pedido."
            )

        already_returned = (
            ReturnItem.objects
            .filter(
                order_item=order_item,
                order_return__order=order
            )
            .aggregate(total=Sum("quantity"))
            .get("total") or 0
        )

        available_to_return = order_item.quantity - already_returned

        if int(quantity) > available_to_return:
            raise ValidationError(
                f"No puedes devolver {quantity} unidad(es) de '{order_item.product.name}'. "
                f"Cantidad comprada: {order_item.quantity}. "
                f"Ya devuelta: {already_returned}. "
                f"Disponible para devolver: {available_to_return}."
            )

        ReturnItem.objects.create(
            order_return=order_return,
            order_item=order_item,
            quantity=quantity
        )

        product = Product.objects.select_for_update().get(pk=order_item.product.pk)
        product.stock += int(quantity)
        product.save()

    return order_return