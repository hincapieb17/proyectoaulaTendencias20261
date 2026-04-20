import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/orders.css";

const STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const VALID_TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const isAdmin = profile?.role === "admin";
  const isClient = !isAdmin;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersRes, profileRes] = await Promise.all([
        api.get("/orders/orders/"),
        api.get("/users/profile/"),
      ]);

      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setProfile(profileRes.data || null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    return number.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });
  };

  const getStatusLabel = (status) => STATUS_LABELS[status] || status;

  const getStatusClass = (status) => {
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

  const replaceOrderInState = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
  };

  const handleConfirm = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");

      const { data } = await api.post(`/orders/orders/${orderId}/confirm/`);
      replaceOrderInState(data);
      setMessage(`Pedido #${orderId} confirmado correctamente.`);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "No se pudo confirmar el pedido."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");

      const { data } = await api.post(`/orders/orders/${orderId}/cancel/`);
      replaceOrderInState(data);
      setMessage(`Pedido #${orderId} cancelado correctamente.`);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "No se pudo cancelar el pedido."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAdminStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");

      const { data } = await api.post(`/orders/orders/${orderId}/change_status/`, {
        status: newStatus,
      });

      replaceOrderInState(data);
      setMessage(`Pedido #${orderId} actualizado a ${getStatusLabel(newStatus)}.`);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "No se pudo cambiar el estado del pedido."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getAvailableAdminStatuses = (currentStatus) => {
    return VALID_TRANSITIONS[currentStatus] || [];
  };

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

  const canClientConfirm = (order) => order.status === "draft";
  const canClientCancel = (order) =>
    ["draft", "confirmed", "preparing"].includes(order.status);

  if (loading) {
    return <div className="orders-loading">Cargando pedidos...</div>;
  }

  return (
    <section className="orders-page">
      <header className="orders-header">
        <div className="orders-header__left">
          <span className="orders-header__label">Gestión operativa</span>
          <h1>Pedidos</h1>
          <p>
            Consulta y administra los pedidos registrados desde una vista clara,
            sobria y profesional.
          </p>
        </div>

        <div className="orders-stats">
          <article className="orders-stat-card">
            <span>Total pedidos</span>
            <strong>{totalOrders}</strong>
          </article>
          <article className="orders-stat-card">
            <span>Entregados</span>
            <strong>{deliveredOrders}</strong>
          </article>
          <article className="orders-stat-card">
            <span>Cancelados</span>
            <strong>{cancelledOrders}</strong>
          </article>
          <article className="orders-stat-card">
            <span>Activos</span>
            <strong>{activeOrders}</strong>
          </article>
        </div>
      </header>

      {error && <div className="orders-alert orders-alert--error">{error}</div>}
      {message && (
        <div className="orders-alert orders-alert--success">{message}</div>
      )}

      <section className="orders-section__title">
        <h2>Listado de pedidos</h2>
        <p>Visualiza el estado, resumen financiero e ítems de cada pedido.</p>
      </section>

      {orders.length === 0 ? (
        <div className="orders-empty">No hay pedidos registrados todavía.</div>
      ) : (
        <div className="orders-grid-pro">
          {orders.map((order) => (
            <article key={order.id} className="order-card-pro">
              <div className="order-card-pro__top">
                <div className="order-card-pro__top-main">
                  <span className="order-card-pro__number">Pedido #{order.id}</span>
                  <h3>
                    {order.customer_name ||
                      order.customer?.full_name ||
                      order.customer?.username ||
                      "Cliente"}
                  </h3>
                </div>

                <span className={getStatusClass(order.status)}>
                  {getStatusLabel(order.status)}
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

              <div className="order-card-pro__actions">
                {isClient && (
                  <div className="order-client-actions">
                    <button
                      type="button"
                      className="order-action-btn order-action-btn--primary"
                      disabled={
                        updatingOrderId === order.id || !canClientConfirm(order)
                      }
                      onClick={() => handleConfirm(order.id)}
                    >
                      Confirmar
                    </button>

                    <button
                      type="button"
                      className="order-action-btn order-action-btn--danger"
                      disabled={
                        updatingOrderId === order.id || !canClientCancel(order)
                      }
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {isAdmin && (
                  <div className="order-admin-actions">
                    <label htmlFor={`order-status-${order.id}`}>
                      Cambiar estado
                    </label>
                    <select
                      id={`order-status-${order.id}`}
                      defaultValue=""
                      disabled={updatingOrderId === order.id}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        handleAdminStatusChange(order.id, e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="">Selecciona una opción</option>
                      {getAvailableAdminStatuses(order.status).map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="order-card-pro__items">
                <h4>Ítems del pedido</h4>

                {order.items?.length ? (
                  <ul>
                    {order.items.map((item, index) => (
                      <li
                        key={item.id ?? `${order.id}-${item.product ?? "item"}-${index}`}
                      >
                        <div className="order-item-text">
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
  );
}

export default Orders;