import { useEffect, useMemo, useState } from "react";
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

function ReturnModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(order.items.map((item) => [item.id, 0]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const items = Object.entries(quantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({ order_item: Number(id), quantity: Number(qty) }));

    if (items.length === 0) {
      setError("Debes ingresar al menos una cantidad mayor que cero.");
      return;
    }

    if (!reason.trim()) {
      setError("El motivo de la devolución es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/orders/orders/${order.id}/returns/`, { reason, items });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "No se pudo registrar la devolución."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <header className="modal-box__header">
          <h3>Registrar Devolución — Pedido #{order.id}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-section">
            <label htmlFor="return-reason">Motivo de la devolución</label>
            <textarea
              id="return-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe el motivo de la devolución..."
            />
          </div>

          <div className="modal-section">
            <p className="modal-section__title">Ítems a devolver</p>
            {order.items.map((item) => (
              <div key={item.id} className="return-item-row">
                <div className="return-item-row__info">
                  <span>{item.product_name || "Producto"}</span>
                  <small>
                    Comprado: {item.quantity} · {formatCurrency(item.unit_price)} c/u
                  </small>
                </div>
                <div className="return-item-row__qty">
                  <label htmlFor={`qty-${item.id}`}>Devolver</label>
                  <input
                    id={`qty-${item.id}`}
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={quantities[item.id]}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="orders-alert orders-alert--error">{error}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Procesando..." : "Confirmar devolución"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [returnOrder, setReturnOrder] = useState(null);

  const isAdmin = profile?.role === "admin";
  const isClient = profile?.role === "cliente";

  useEffect(() => {
    let ignore = false;

    async function fetchInitialData() {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          api.get("/orders/orders/"),
          api.get("/users/profile/"),
        ]);

        if (ignore) return;

        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setProfile(profileRes.data || null);
        setError("");
      } catch (err) {
        console.error(err);
        if (ignore) return;
        setError("No se pudieron cargar los pedidos.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchInitialData();
    return () => {
      ignore = true;
    };
  }, []);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });

  const getStatusLabel = (s) => STATUS_LABELS[s] || s;
  const getStatusClass = (s) => `orders-badge orders-badge--${s}`;

  const replaceOrderInState = (updatedOrder) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );

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
    const reason = window.prompt("Motivo de cancelación (opcional):");
    if (reason === null) return;

    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");
      const { data } = await api.post(`/orders/orders/${orderId}/cancel/`, {
        reason,
      });
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
    let reason = "";
    if (newStatus === "cancelled") {
      const input = window.prompt("Motivo de cancelación (opcional):");
      if (input === null) return;
      reason = input;
    }

    try {
      setUpdatingOrderId(orderId);
      setError("");
      setMessage("");
      const { data } = await api.post(
        `/orders/orders/${orderId}/change_status/`,
        { status: newStatus, reason }
      );
      replaceOrderInState(data);
      setMessage(
        `Pedido #${orderId} actualizado a ${getStatusLabel(newStatus)}.`
      );
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
  const canReturn = (order) => order.status === "delivered";

  if (loading) {
    return <div className="orders-loading">Cargando pedidos...</div>;
  }

  return (
    <section className="orders-page">
      {returnOrder && (
        <ReturnModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSuccess={() =>
            setMessage(`Devolución registrada para el pedido #${returnOrder.id}.`)
          }
        />
      )}

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

              {order.status === "cancelled" && order.cancellation_reason && (
                <div className="order-cancel-reason">
                  <strong>Motivo:</strong> {order.cancellation_reason}
                </div>
              )}

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

                    {canReturn(order) && (
                      <button
                        type="button"
                        className="order-action-btn order-action-btn--return"
                        disabled={updatingOrderId === order.id}
                        onClick={() => setReturnOrder(order)}
                      >
                        Devolver
                      </button>
                    )}
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
                      {(VALID_TRANSITIONS[order.status] || []).map((s) => (
                        <option key={s} value={s}>
                          {getStatusLabel(s)}
                        </option>
                      ))}
                    </select>

                    {canReturn(order) && (
                      <button
                        type="button"
                        className="order-action-btn order-action-btn--return"
                        disabled={updatingOrderId === order.id}
                        onClick={() => setReturnOrder(order)}
                      >
                        Registrar devolución
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="order-card-pro__items">
                <h4>Ítems del pedido</h4>

                {order.items?.length ? (
                  <ul>
                    {order.items.map((item, index) => (
                      <li
                        key={
                          item.id ??
                          `${order.id}-${item.product ?? "item"}-${index}`
                        }
                      >
                        <div className="order-item-text">
                          <strong>
                            {item.product_name || "Producto"}
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
