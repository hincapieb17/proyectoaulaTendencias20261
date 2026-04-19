from decimal import Decimal
from django.db import models
from apps.customers.models import Customer
from apps.products.models import Product


class Order(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('confirmed', 'Confirmado'),
        ('preparing', 'En preparación'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    ]

    # El pedido pertenece a un cliente
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='orders'
    )

    # Estado inicial del pedido
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    # Totales del pedido
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_totals(self):
        # Se suman los subtotales de los ítems
        subtotal = sum(item.subtotal for item in self.items.all())
        self.subtotal = subtotal

        # Regla de descuento simple para la entrega
        if self.subtotal >= Decimal('500000'):
            self.discount = self.subtotal * Decimal('0.10')
        else:
            self.discount = Decimal('0.00')

        self.total = self.subtotal - self.discount

    def save(self, *args, **kwargs):
        if self.pk:
            self.calculate_totals()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pedido #{self.id} - {self.customer.full_name} - {self.status}"


class OrderItem(models.Model):
    # Un pedido puede tener muchos ítems
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )

    # Producto comprado
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items'
    )

    # Cantidad solicitada
    quantity = models.PositiveIntegerField()

    # Precio unitario congelado al momento de la compra
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # Subtotal del ítem
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )

    def save(self, *args, **kwargs):
        # Se congela el precio actual del producto
        if self.unit_price == Decimal('0.00'):
            self.unit_price = self.product.price

        self.subtotal = Decimal(self.quantity) * self.unit_price
        super().save(*args, **kwargs)

        # Cada vez que se guarda un item se recalculan los totales del pedido
        self.order.calculate_totals()
        super(Order, self.order).save(update_fields=['subtotal', 'discount', 'total'])

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"