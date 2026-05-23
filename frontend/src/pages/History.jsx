import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/history.css";

const STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "draft", label: "Borrador" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "En preparación" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const { data } = await api.get(`/orders/orders/?${params.toString()}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("No se pudo cargar el historial de pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleReset = () => {
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setTimeout(fetchOrders, 0);
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusClass = (s) => `history-badge history-badge--${s}`;

  return (
    <section className="history-page">
      <header className="history-header">
        <span className="history-header__label">Seguimiento</span>
        <h1>Historial de Pedidos</h1>
        <p>Consulta todos tus pedidos con filtros por estado y rango de fechas.</p>
      </header>

      <form className="history-filters" onSubmit={handleFilter}>
        <div className="history-filters__group">
          <label htmlFor="history-status">Estado</label>
          <select
            id="history-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="history-filters__group">
          <label htmlFor="history-start">Desde</label>
          <input
            id="history-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="history-filters__group">
          <label htmlFor="history-end">Hasta</label>
          <input
            id="history-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="history-filters__actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            Filtrar
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Limpiar
          </button>
        </div>
      </form>

      {error && <div className="history-alert history-alert--error">{error}</div>}

      {loading ? (
        <div className="history-loading">Cargando historial...</div>
      ) : orders.length === 0 ? (
        <div className="history-empty">No hay pedidos que coincidan con los filtros.</div>
      ) : (
        <div className="history-list">
          {orders.map((order) => (
            <article key={order.id} className="history-card">
              <div className="history-card__header">
                <div>
                  <span className="history-card__number">Pedido #{order.id}</span>
                  {order.customer_name && (
                    <span className="history-card__customer">{order.customer_name}</span>
                  )}
                  <span className="history-card__date">{formatDate(order.created_at)}</span>
                </div>
                <span className={getStatusClass(order.status)}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="history-card__items">
                {order.items?.map((item) => (
                  <div key={item.id} className="history-item">
                    <span className="history-item__name">
                      {item.product_name || "Producto"}
                    </span>
                    <span className="history-item__detail">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </span>
                    <span className="history-item__subtotal">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="history-card__totals">
                <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                {Number(order.discount) > 0 && (
                  <span className="history-totals__discount">
                    Descuento: -{formatCurrency(order.discount)}
                  </span>
                )}
                <strong>Total: {formatCurrency(order.total)}</strong>
              </div>

              {order.status === "cancelled" && order.cancellation_reason && (
                <div className="history-card__cancel-reason">
                  <strong>Motivo de cancelación:</strong> {order.cancellation_reason}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default History;
