"""
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
"""
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = [
        ('activo', 'Activo'),
        ('agotado', 'Agotado'),
        ('descontinuado', 'Descontinuado'),
    ]

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)  # El codigo unico del producto
    description = models.TextField()
    # Relacionamos el producto con una categoria. Si se borra la categoria, se borra el producto (CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='activo')

    def save(self, *args, **kwargs):
        
        if self.stock == 0:
            self.status = 'agotado'
        elif self.status == 'agotado' and self.stock > 0:
            self.status = 'activo'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name