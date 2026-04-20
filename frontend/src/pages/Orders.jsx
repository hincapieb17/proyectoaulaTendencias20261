import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchOrders() {
      try {
        if (!ignore) {
          setLoading(true);
          setError("");
        }

        const response = await api.get("/orders/orders/");

        if (!ignore) {
          setOrders(response.data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("No se pudieron cargar los pedidos.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      ignore = true;
    };
  }, []);

  const totalOrders = orders.length;

  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered").length,
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === "cancelled").length,
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["draft", "confirmed", "preparing", "shipped"].includes(o.status)
      ).length,
    [orders]
  );

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    return number.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });
  };

  const translateOrderStatus = (status) => {
    switch (status) {
      case "draft":
        return "Borrador";
      case "confirmed":
        return "Confirmado";
      case "preparing":
        return "En preparación";
      case "shipped":
        return "Enviado";
      case "delivered":
        return "Entregado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getOrderStatusClass = (status) => {
    switch (status) {
      case "draft":
        return "orders-badge orders-badge--draft";
      case "confirmed":
        return "orders-badge orders-badge--confirmed";
      case "preparing":
        return "orders-badge orders-badge--preparing";
      case "shipped":
        return "orders-badge orders-badge--shipped";
      case "delivered":
        return "orders-badge orders-badge--delivered";
      case "cancelled":
        return "orders-badge orders-badge--cancelled";
      default:
        return "orders-badge";
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <section className="orders-header">
        <div className="orders-header__left">
          <span className="orders-header__label">Gestión operativa</span>
          <h1>Pedidos</h1>
          <p>
            Consulta y administra los pedidos registrados desde una vista clara,
            sobria y profesional.
          </p>
        </div>

        <div className="orders-stats">
          <div className="orders-stat-card">
            <span>Total pedidos</span>
            <strong>{totalOrders}</strong>
          </div>

          <div className="orders-stat-card">
            <span>Entregados</span>
            <strong>{deliveredOrders}</strong>
          </div>

          <div className="orders-stat-card">
            <span>Cancelados</span>
            <strong>{cancelledOrders}</strong>
          </div>

          <div className="orders-stat-card">
            <span>Activos</span>
            <strong>{activeOrders}</strong>
          </div>
        </div>
      </section>

      {error && <div className="orders-alert orders-alert--error">{error}</div>}

      <section className="orders-section">
        <div className="orders-section__title">
          <h2>Listado de pedidos</h2>
          <p>
            Visualiza el estado, resumen financiero e ítems de cada pedido.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">No hay pedidos registrados todavía.</div>
        ) : (
          <div className="orders-grid-pro">
            {orders.map((order) => (
              <article key={order.id} className="order-card-pro">
                <div className="order-card-pro__top">
                  <div>
                    <span className="order-card-pro__number">
                      Pedido #{order.id}
                    </span>
                    <h3>
                      {order.customer_name ||
                        order.customer?.full_name ||
                        order.customer?.username ||
                        "Cliente"}
                    </h3>
                  </div>

                  <span className={getOrderStatusClass(order.status)}>
                    {translateOrderStatus(order.status)}
                  </span>
                </div>

                <div className="order-card-pro__summary">
                  <div className="order-metric">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(order.subtotal)}</strong>
                  </div>

                  <div className="order-metric">
                    <span>Descuento</span>
                    <strong>{formatCurrency(order.discount)}</strong>
                  </div>

                  <div className="order-metric order-metric--total">
                    <span>Total</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </div>

                <div className="order-card-pro__items">
                  <h4>Ítems del pedido</h4>

                  {order.items?.length ? (
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>
                              {item.product_name || item.product?.name || "Producto"}
                            </strong>
                            <span>
                              Cantidad: {item.quantity} · Unitario:{" "}
                              {formatCurrency(item.unit_price)}
                            </span>
                          </div>
                          <b>{formatCurrency(item.subtotal)}</b>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="order-card-pro__empty-items">
                      Este pedido no tiene ítems.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Orders;