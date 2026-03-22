# API REST - Gestión de Pedidos (Primer Entregable)

## Descripción

API REST desarrollada con Django Rest Framework para gestionar:

* Registro y autenticación de usuarios
* Gestión de clientes (Customer)
* Gestión de categorías
* Gestión de productos

---

## Tecnologías

* Python
* Django
* Django Rest Framework
* JWT (SimpleJWT)
* SQLite
* Postman

---

# AUTENTICACIÓN

## Registro de usuario

```bash
POST /api/users/register/
```

### Body:

```json
{
  "username": "cliente1",
  "password": "123456789",
  "role": "cliente"
}
```

---

## Login

```bash
POST /api/users/login/
```

### Body:

```json
{
  "username": "cliente1",
  "password": "123456789"
}
```

### Respuesta:

```json
{
  "access": "TOKEN",
  "refresh": "TOKEN"
}
```

---

## Uso del token

En cada petición protegida:

```bash
Authorization: Bearer <access_token>
```

---

# CUSTOMERS

## Descripción

El Customer se asocia automáticamente al usuario autenticado.

* No se envía el campo `user`
* Un usuario solo puede tener un Customer

---

## Crear Customer

```bash
POST /api/customers/customers/
```

### Body:

```json
{
  "full_name": "Juan Pérez",
  "phone": "3001234567",
  "address": "Medellín"
}
```

---

## Listar Customers

```bash
GET /api/customers/customers/
```

### Comportamiento:

* Admin → ve todos los customers
* Cliente → solo ve su información

---

## Actualizar Customer

```bash
PUT /api/customers/customers/{id}/
```

---

## Eliminar Customer

```bash
DELETE /api/customers/customers/{id}/
```

---

# CATEGORIES

## Crear categoría

```bash
POST /api/products/categories/
```

### Body:

```json
{
  "name": "Electrónica",
  "description": "Productos electrónicos"
}
```

---

## Listar categorías

```bash
GET /api/products/categories/
```

---

## Actualizar categoría

```bash
PUT /api/products/categories/{id}/
```

---

## Eliminar categoría

```bash
DELETE /api/products/categories/{id}/
```

---

# PRODUCTS

## Crear producto

```bash
POST /api/products/products/
```

### Body:

```json
{
  "name": "Mouse",
  "sku": "MOU123",
  "description": "Mouse gamer",
  "category": 1,
  "price": 50000,
  "stock": 0,
  "status": "activo"
}
```

---

## Listar productos

```bash
GET /api/products/products/
```

---

## Actualizar producto

```bash
PUT /api/products/products/{id}/
```

---

## Eliminar producto

```bash
DELETE /api/products/products/{id}/
```

---

# Reglas de negocio

* El SKU debe ser único
* Cuando el stock llega a 0 → el producto debe quedar como **agotado**
* El Customer:

  * Se crea con el usuario autenticado
  * No permite duplicados por usuario

---

# Seguridad

* Autenticación con JWT
* Uso de `Authorization: Bearer <token>`
* Control de acceso:

  * Admin → acceso completo
  * Cliente → acceso restringido
* Un cliente no puede ver información de otros clientes

---

# Pruebas realizadas

Se validó en Postman:

* Registro y login de usuarios
* Uso correcto del token JWT
* CRUD completo de:

  * Customers
  * Categories
  * Products
* Validaciones:

  * SKU único
  * Customer único por usuario
* Control de permisos por rol

---

# Estructura del proyecto

```
GestionPedidos/
│
├── apps/
│   ├── users/
│   ├── customers/
│   ├── products/
│   └── orders/
│
├── GestionPedidos/
│   ├── settings.py
│   ├── urls.py
│
└── manage.py
```

---

# Autor

Brayan Hincapié Monsalve
Ingeniería de Software – Tecnológico de Antioquia

