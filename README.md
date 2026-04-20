# API REST y Frontend Web - Gestión de Pedidos

## Autor

**Brayan Hincapié Monsalve**  
Ingeniería de Software – Tecnológico de Antioquia

---

## Descripción

Proyecto de gestión de pedidos desarrollado con **Django Rest Framework** y un **frontend en React + Vite**.

El sistema permite:

- Registro, login y autenticación con JWT
- Gestión de perfiles de usuario con roles **admin** y **cliente**
- Gestión de clientes
- Gestión de categorías y productos
- Creación de pedidos con múltiples ítems
- Cálculo automático de subtotal, descuento y total
- Confirmación de pedidos con validación y reserva de stock
- Cambio de estados del pedido según transiciones válidas
- Visualización de información desde el frontend conectado a la API

---

## Tecnologías

### Backend
- Python
- Django
- Django Rest Framework
- SimpleJWT
- SQLite

### Frontend
- React
- Vite
- Axios
- React Router

### Pruebas
- Vitest
- Testing Library

---

## Roles del sistema

### Admin
- Acceso completo a customers, categorías, productos y pedidos
- Puede consultar todos los pedidos
- Puede cambiar el estado de los pedidos según las transiciones válidas del sistema

### Cliente
- Puede registrarse e iniciar sesión
- Puede gestionar su perfil y su customer
- Puede consultar únicamente su propia información y sus propios pedidos

---

## Autenticación

### Registro
```bash
POST /api/users/register/
```

### Body
```json
{
  "username": "cliente1",
  "password": "123456789"
}
```

### Login
```bash
POST /api/users/login/
```

### Body
```json
{
  "username": "cliente1",
  "password": "123456789"
}
```

### Respuesta
```json
{
  "access": "TOKEN",
  "refresh": "TOKEN"
}
```

### Uso del token
En cada petición protegida:

```bash
Authorization: Bearer <access_token>
```

---

## Módulos principales

## 1. Users

### Endpoints
```bash
POST   /api/users/register/
POST   /api/users/login/
POST   /api/users/token/refresh/
GET    /api/users/profile/
PUT    /api/users/profile/
```

### Reglas
- Los usuarios nuevos se registran con rol **cliente**
- El sistema usa autenticación JWT
- El perfil autenticado puede consultarse y actualizarse

---

## 2. Customers

### Endpoints
```bash
POST   /api/customers/customers/
GET    /api/customers/customers/
GET    /api/customers/customers/{id}/
PUT    /api/customers/customers/{id}/
DELETE /api/customers/customers/{id}/
```

### Reglas
- El customer se asocia automáticamente al usuario autenticado
- Un usuario solo puede tener un customer
- El admin puede ver todos los customers
- El cliente solo puede ver y gestionar su propio customer

---

## 3. Categories

### Endpoints
```bash
POST   /api/products/categories/
GET    /api/products/categories/
GET    /api/products/categories/{id}/
PUT    /api/products/categories/{id}/
DELETE /api/products/categories/{id}/
```

### Reglas
- Las categorías se gestionan desde la API
- El nombre debe ser consistente con la lógica del módulo de productos

---

## 4. Products

### Endpoints
```bash
POST   /api/products/products/
GET    /api/products/products/
GET    /api/products/products/{id}/
PUT    /api/products/products/{id}/
DELETE /api/products/products/{id}/
```

### Ejemplo de creación
```json
{
  "name": "Mouse gamer",
  "sku": "MOU123",
  "description": "Mouse RGB",
  "category": 1,
  "price": "50000.00",
  "stock": 10,
  "status": "activo"
}
```

### Reglas
- El SKU debe ser único
- Si el stock llega a 0, el producto pasa a **agotado**
- Si el stock es mayor que 0, el producto puede permanecer **activo**
- Los productos pueden ser usados para crear ítems de pedidos

---

## 5. Orders

### Endpoints principales
```bash
POST   /api/orders/orders/
GET    /api/orders/orders/
GET    /api/orders/orders/{id}/
PUT    /api/orders/orders/{id}/
DELETE /api/orders/orders/{id}/
POST   /api/orders/orders/{id}/confirm/
POST   /api/orders/orders/{id}/change_status/
```

### Ejemplo de creación de pedido
```json
{
  "customer": 1,
  "items": [
    {
      "product": 1,
      "quantity": 2
    },
    {
      "product": 2,
      "quantity": 1
    }
  ]
}
```

### Qué hace el módulo de pedidos
- Permite crear pedidos con múltiples ítems
- Cada ítem guarda producto, cantidad, precio unitario y subtotal
- El pedido calcula automáticamente:
  - subtotal
  - descuento
  - total

### Reglas de negocio de pedidos
- El pedido debe tener al menos un ítem
- No se puede repetir un producto dentro del mismo pedido
- No se pueden agregar productos agotados
- No se puede solicitar más cantidad de la disponible
- El pedido inicia en estado **draft**
- Las transiciones válidas son:

```text
draft -> confirmed, cancelled
confirmed -> preparing, cancelled
preparing -> shipped, cancelled
shipped -> delivered
delivered -> sin transición
cancelled -> sin transición
```

### Confirmación del pedido
Al confirmar un pedido:

- Debe estar en estado **draft**
- Debe tener ítems
- Se valida stock de todos los productos
- Si falta stock en alguno, no se confirma
- Si todo es válido, se descuenta stock
- El pedido pasa a **confirmed**

### Cancelación del pedido
La lógica de negocio del backend contempla cancelación con estas reglas:

- Se puede cancelar desde:
  - **draft**
  - **confirmed**
  - **preparing**
- Si se cancela desde **confirmed** o **preparing**, el stock se libera automáticamente
- No se puede cancelar un pedido **shipped**, **delivered** o ya **cancelled**

---

## Frontend

El proyecto incluye un frontend en React conectado a la API por medio de Axios.

### Vistas principales del frontend
- Login
- Registro
- Productos
- Pedidos
- Perfil

### Integración
- Manejo de tokens JWT
- Interceptor para refrescar token automáticamente
- Consumo de endpoints de autenticación, productos y pedidos

---

## Pruebas

Actualmente el proyecto incluye pruebas frontend con **Vitest** y **Testing Library** en páginas como:

- Login
- Register
- Products
- Orders

Estas pruebas validan principalmente renderizado, flujo básico de interfaz y consumo inicial de datos.

---

## Seguridad

- Autenticación con JWT
- Header `Authorization: Bearer <token>`
- Control de acceso por roles:
  - **admin**: acceso ampliado
  - **cliente**: acceso restringido a sus propios recursos
- Un cliente no puede ver customers de otros usuarios
- Un cliente no puede consultar pedidos de otros usuarios

---

## Estructura general del proyecto

```text
proyectoaulaTendencias20261/
│
├── apps/
│   ├── users/
│   ├── customers/
│   ├── products/
│   └── orders/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── styles/
│
├── config/
│   ├── settings.py
│   └── urls.py
│
└── manage.py
```

---

## Estado actual del proyecto

El repositorio ya incluye:

- Backend funcional para users, customers, products y orders
- Reglas de negocio para stock y transiciones de estado
- Frontend conectado a la API
- Pruebas frontend iniciales

Como mejora futura, conviene fortalecer:

- pruebas de API para el módulo de pedidos
- cobertura de casos críticos de stock, cancelación y transiciones
- cierre completo de flujos de pedidos en interfaz según los requerimientos finales

---
