from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.customers.models import Customer
from apps.products.models import Category, Product
from apps.orders.models import Order, OrderItem
from apps.orders.services import (
    confirm_order,
    cancel_order,
    change_order_status,
    process_return,
)
from django.core.exceptions import ValidationError

User = get_user_model()


def make_user(username="testuser", role="cliente"):
    return User.objects.create_user(
        username=username, password="pass1234", role=role
    )


def make_customer(user):
    return Customer.objects.create(
        user=user,
        full_name="Test User",
        email=f"{user.username}@test.com",
        phone="3001234567",
        address="Calle 1 #2-3",
    )


def make_product(name="Producto A", price=100000, stock=10):
    cat, _ = Category.objects.get_or_create(name="General")
    return Product.objects.create(
        name=name,
        sku=f"SKU-{name[:5].upper()}-{price}",
        description="desc",
        category=cat,
        price=Decimal(str(price)),
        stock=stock,
    )


def make_order(customer, product, quantity=2):
    order = Order.objects.create(customer=customer)
    OrderItem.objects.create(
        order=order,
        product=product,
        quantity=quantity,
        unit_price=product.price,
    )
    order.calculate_totals()
    order.save()
    return order


class ConfirmOrderTest(TestCase):
    def setUp(self):
        user = make_user()
        self.customer = make_customer(user)
        self.product = make_product(stock=10)
        self.order = make_order(self.customer, self.product, quantity=3)

    def test_confirm_reduces_stock(self):
        confirm_order(self.order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

    def test_confirm_sets_status(self):
        confirm_order(self.order)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "confirmed")

    def test_confirm_fails_without_stock(self):
        self.product.stock = 1
        self.product.save()
        with self.assertRaises(ValidationError):
            confirm_order(self.order)

    def test_confirm_fails_if_not_draft(self):
        self.order.status = "confirmed"
        self.order.save()
        with self.assertRaises(ValidationError):
            confirm_order(self.order)

    def test_confirm_fails_empty_order(self):
        order = Order.objects.create(customer=self.customer)
        with self.assertRaises(ValidationError):
            confirm_order(order)


class CancelOrderTest(TestCase):
    def setUp(self):
        user = make_user(username="canceluser")
        self.customer = make_customer(user)
        self.product = make_product(name="Producto B", price=50000, stock=10)
        self.order = make_order(self.customer, self.product, quantity=3)

    def test_cancel_draft_order(self):
        cancel_order(self.order)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "cancelled")

    def test_cancel_restores_stock_when_confirmed(self):
        confirm_order(self.order)
        self.product.refresh_from_db()
        stock_after_confirm = self.product.stock

        cancel_order(self.order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, stock_after_confirm + 3)

    def test_cancel_saves_reason(self):
        cancel_order(self.order, reason="El cliente cambió de opinión")
        self.order.refresh_from_db()
        self.assertEqual(self.order.cancellation_reason, "El cliente cambió de opinión")
        self.assertIsNotNone(self.order.cancelled_at)

    def test_cannot_cancel_delivered_order(self):
        self.order.status = "delivered"
        self.order.save()
        with self.assertRaises(ValidationError):
            cancel_order(self.order)


class ChangeStatusTest(TestCase):
    def setUp(self):
        user = make_user(username="statususer")
        self.customer = make_customer(user)
        self.product = make_product(name="Producto C", price=80000, stock=10)
        self.order = make_order(self.customer, self.product, quantity=2)

    def test_valid_transition_draft_to_confirmed(self):
        change_order_status(self.order, "confirmed")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "confirmed")

    def test_invalid_transition_raises_error(self):
        with self.assertRaises(ValidationError):
            change_order_status(self.order, "delivered")

    def test_change_to_cancelled_passes_reason(self):
        change_order_status(self.order, "cancelled", reason="Motivo X")
        self.order.refresh_from_db()
        self.assertEqual(self.order.cancellation_reason, "Motivo X")


class ProcessReturnTest(TestCase):
    def setUp(self):
        user = make_user(username="returnuser")
        self.customer = make_customer(user)
        self.product = make_product(name="Producto D", price=60000, stock=20)
        self.order = make_order(self.customer, self.product, quantity=5)
        confirm_order(self.order)
        self.order.status = "delivered"
        self.order.save()
        self.order_item = self.order.items.first()

    def test_return_restores_stock(self):
        self.product.refresh_from_db()
        stock_before = self.product.stock

        process_return(
            self.order,
            reason="Producto dañado",
            items_data=[{"order_item": self.order_item.id, "quantity": 2}],
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, stock_before + 2)

    def test_return_fails_if_not_delivered(self):
        self.order.status = "confirmed"
        self.order.save()
        with self.assertRaises(ValidationError):
            process_return(
                self.order,
                reason="Motivo",
                items_data=[{"order_item": self.order_item.id, "quantity": 1}],
            )

    def test_return_fails_exceeding_quantity(self):
        with self.assertRaises(ValidationError):
            process_return(
                self.order,
                reason="Motivo",
                items_data=[{"order_item": self.order_item.id, "quantity": 999}],
            )

    def test_return_fails_without_reason(self):
        with self.assertRaises(ValidationError):
            process_return(
                self.order,
                reason="   ",
                items_data=[{"order_item": self.order_item.id, "quantity": 1}],
            )

    def test_return_fails_without_items(self):
        with self.assertRaises(ValidationError):
            process_return(self.order, reason="Motivo", items_data=[])


class OrderTotalsTest(TestCase):
    def setUp(self):
        user = make_user(username="totaluser")
        self.customer = make_customer(user)

    def test_discount_applied_above_500000(self):
        product = make_product(name="Caro", price=600000, stock=5)
        order = make_order(self.customer, product, quantity=1)
        self.assertEqual(order.discount, Decimal("60000.00"))
        self.assertEqual(order.total, Decimal("540000.00"))

    def test_no_discount_below_500000(self):
        product = make_product(name="Barato", price=100000, stock=10)
        order = make_order(self.customer, product, quantity=2)
        self.assertEqual(order.discount, Decimal("0.00"))
        self.assertEqual(order.total, Decimal("200000.00"))
