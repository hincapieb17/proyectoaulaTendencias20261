# Sistema de Gestión de Pedidos

## Autor

**Brayan Hincapié Monsalve**  
Ingeniería de Software – Tecnológico de Antioquia

---

## Proyecto en producción

**Frontend:** https://proyectoaula-tendencias20261-2736.vercel.app/

| Credenciales de prueba | Usuario | Contraseña |
|------------------------|---------|------------|
| Administrador          | admin   | admin      |

---

## Descripción

Sistema web de gestión de pedidos desarrollado con **Django REST Framework** en el backend y **React + Vite** en el frontend. Permite administrar productos, clientes, pedidos y generar reportes de ventas, con autenticación JWT y control de acceso por roles.

### Funcionalidades principales

- Registro, login y autenticación con JWT
- Roles de usuario: **admin** y **cliente**
- Gestión de categorías y productos con control de stock automático
- Gestión de perfiles de cliente
- Creación y gestión de pedidos con múltiples ítems
- Cálculo automático de subtotal, descuento (10% para pedidos ≥ $500.000) y total
- Confirmación de pedidos con validación y descuento de stock
- Cambio de estados del pedido con transiciones controladas
- Cancelación de pedidos con reintegro automático de stock
- Registro de devoluciones parciales o totales con reintegro de stock
- Historial de pedidos
- Reportes de ventas con top productos, top clientes y pedidos cancelados
- Renovación automática de tokens JWT sin cerrar sesión

---

## Tecnologías

### Backend
- Python 3.13
- Django 6
- Django REST Framework
- SimpleJWT (autenticación JWT)
- PostgreSQL (Neon — serverless cloud)
- dj-database-url
- WhiteNoise (archivos estáticos)
- django-cors-headers

### Frontend
- React 18
- Vite
- Axios (con interceptores para JWT)
- React Router v6

### Pruebas
- Vitest
- Testing Library

### Despliegue
- Vercel (backend como serverless Python + frontend como SPA estática)
- Neon (PostgreSQL serverless)

---

## Roles del sistema

### Admin
- Acceso completo a todos los clientes, categorías, productos y pedidos
- Puede crear, editar y eliminar productos y categorías
- Puede cambiar el estado de cualquier pedido
- Puede ver reportes de ventas

### Cliente
- Se registra con rol cliente automáticamente
- Puede gestionar su propio perfil y datos de cliente
- Solo puede ver y gestionar sus propios pedidos
- Puede confirmar y cancelar sus pedidos
- Puede registrar devoluciones de pedidos entregados

---

## Autenticación JWT

El sistema usa JSON Web Tokens. Al hacer login se obtienen dos tokens:

| Token   | Duración | Uso |
|---------|----------|-----|
| access  | 30 min   | Se envía en cada petición en el header `Authorization` |
| refresh | 1 día    | Se usa para renovar el access sin volver a hacer login |

```
Authorization: Bearer <access_token>
```

El frontend renueva el access token automáticamente al expirar usando el interceptor de Axios.

---

## Endpoints

### Usuarios — `/api/users/`

```
POST   /api/users/register/         Registrar nuevo usuario (rol cliente)
POST   /api/users/login/            Login → devuelve access + refresh tokens
POST   /api/users/token/refresh/    Renovar access token
GET    /api/users/profile/          Ver perfil del usuario autenticado
PUT    /api/users/profile/          Actualizar perfil
```

### Clientes — `/api/customers/`

```
GET    /api/customers/              Admin: todos | Cliente: solo el suyo
POST   /api/customers/              Crear perfil de cliente
GET    /api/customers/{id}/         Ver cliente por ID
PUT    /api/customers/{id}/         Editar cliente
DELETE /api/customers/{id}/         Eliminar cliente
GET    /api/customers/profile/      Perfil del cliente autenticado
```

### Categorías y Productos — `/api/products/`

```
GET    /api/products/categories/         Listar categorías (autenticado)
POST   /api/products/categories/         Crear categoría (solo admin)
GET    /api/products/categories/{id}/    Ver categoría
PUT    /api/products/categories/{id}/    Editar categoría (solo admin)
DELETE /api/products/categories/{id}/    Eliminar categoría (solo admin)

GET    /api/products/products/           Listar productos (autenticado)
POST   /api/products/products/           Crear producto (solo admin)
GET    /api/products/products/{id}/      Ver producto
PUT    /api/products/products/{id}/      Editar producto (solo admin)
DELETE /api/products/products/{id}/      Eliminar producto (solo admin)
```

### Pedidos — `/api/orders/`

```
GET    /api/orders/                          Listar pedidos (admin: todos | cliente: los suyos)
POST   /api/orders/                          Crear pedido en borrador
GET    /api/orders/{id}/                     Ver detalle de un pedido
POST   /api/orders/{id}/confirm/             Confirmar pedido y descontar stock
POST   /api/orders/{id}/cancel/              Cancelar pedido y reintegrar stock
POST   /api/orders/{id}/change_status/       Cambiar estado (solo admin)
GET    /api/orders/{id}/returns/             Ver devoluciones del pedido
POST   /api/orders/{id}/returns/             Registrar devolución
```

Filtros disponibles en `GET /api/orders/`:
- `?status=confirmed`
- `?start_date=2025-01-01&end_date=2025-12-31`

### Reportes — `/api/reports/`

```
GET    /api/reports/sales/    Reporte de ventas (solo admin)
```

Parámetros opcionales: `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Incluye: resumen de ventas, pedidos por estado, top 10 productos más vendidos, top 10 clientes, últimos 20 pedidos cancelados.

---

## Reglas de negocio

### Productos
- El SKU debe ser único
- Si el stock llega a 0, el estado cambia a **agotado** automáticamente
- Si se repone stock, vuelve a **activo** automáticamente

### Pedidos
- Debe tener al menos un ítem
- No se puede repetir un producto dentro del mismo pedido
- No se pueden agregar productos agotados
- No se puede pedir más cantidad de la disponible en stock
- El precio unitario se congela al momento de crear el ítem
- Descuento del 10% si el subtotal supera $500.000

### Transiciones de estado

```
draft     → confirmed, cancelled
confirmed → preparing, cancelled
preparing → shipped, cancelled
shipped   → delivered
delivered → (estado final)
cancelled → (estado final)
```

### Confirmación
- Solo pedidos en estado **draft**
- Se valida stock de todos los productos antes de descontar
- Si falta stock en alguno, no se confirma ninguno (transacción atómica)

### Cancelación
- Se puede cancelar desde **draft**, **confirmed** o **preparing**
- Si estaba en **confirmed** o **preparing**, el stock se reintegra automáticamente
- No se puede cancelar desde **shipped**, **delivered** o **cancelled**

### Devoluciones
- Solo sobre pedidos en estado **delivered**
- No se puede devolver más cantidad de la comprada
- Se descuenta lo ya devuelto en devoluciones anteriores del mismo ítem
- El stock se reintegra automáticamente al registrar la devolución

---

## Estructura del proyecto

```
proyectoaulaTendencias20261/
│
├── api/
│   └── index.py              # Entry point serverless para Vercel
│
├── GestionPedidos/
│   ├── settings.py           # Configuración Django (env vars para producción)
│   ├── urls.py               # Enrutamiento principal
│   └── wsgi.py
│
├── apps/
│   ├── users/                # Registro, login, perfil
│   ├── customers/            # Perfil de cliente
│   ├── products/             # Categorías y productos
│   ├── orders/               # Pedidos, ítems, devoluciones
│   └── reports/              # Reportes de ventas
│
├── core/
│   ├── permissions.py        # Permisos personalizados
│   ├── pagination.py
│   └── utils.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, Register, Dashboard, Products, Orders...
│   │   ├── components/       # Navbar, ProtectedRoute, UI components
│   │   ├── context/          # AuthContext y AuthProvider
│   │   ├── routes/           # AppRouter con rutas protegidas
│   │   ├── services/         # api.js (Axios + interceptores JWT)
│   │   └── styles/           # CSS modular por módulo
│   └── vercel.json           # Configuración SPA para Vercel
│
├── vercel.json               # Configuración backend serverless
├── requirements.txt
└── manage.py
```

---

## Despliegue

El proyecto está desplegado en **Vercel** como dos proyectos separados:

- **Frontend:** https://proyectoaula-tendencias20261-2736.vercel.app/
- **Backend:** Vercel serverless Python (`@vercel/python`)
- **Base de datos:** Neon PostgreSQL (serverless, compatible con Vercel)

Las migraciones se ejecutan apuntando directamente a la base de datos en Neon mediante la variable de entorno `DATABASE_URL`.

---

## Pruebas

El proyecto incluye pruebas frontend con **Vitest** y **Testing Library** para los módulos:

- Login
- Register
- Products
- Orders
- Profile
- AuthProvider
- ProtectedRoute
