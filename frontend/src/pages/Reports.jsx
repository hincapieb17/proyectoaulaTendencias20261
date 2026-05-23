import { useState } from "react";
import api from "../services/api";
import "../styles/reports.css";

function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    });

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CO");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const { data } = await api.get(`/reports/sales/?${params.toString()}`);
      setReport(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "No se pudo cargar el reporte."
      );
    } finally {
      setLoading(false);
    }
  };

  const STATUS_LABELS = {
    draft: "Borrador",
    confirmed: "Confirmado",
    preparing: "En preparación",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return (
    <section className="reports-page">
      <header className="reports-header">
        <span className="reports-header__label">Análisis y estadísticas</span>
        <h1>Reportes de Ventas</h1>
        <p>Consulta ventas totales, productos más vendidos, clientes top y pedidos cancelados.</p>
      </header>

      <form className="reports-filter" onSubmit={handleSubmit}>
        <div className="reports-filter__group">
          <label htmlFor="start_date">Fecha inicio</label>
          <input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="reports-filter__group">
          <label htmlFor="end_date">Fecha fin</label>
          <input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Cargando..." : "Generar reporte"}
        </button>
      </form>

      {error && <div className="reports-alert reports-alert--error">{error}</div>}

      {report && (
        <div className="reports-content">
          <section className="reports-summary">
            <h2>Resumen del período</h2>
            <div className="reports-summary__grid">
              <article className="report-stat-card">
                <span>Total vendido</span>
                <strong>{formatCurrency(report.summary.total_sales)}</strong>
              </article>
              <article className="report-stat-card">
                <span>Pedidos entregados</span>
                <strong>{report.summary.total_delivered_orders}</strong>
              </article>
              <article className="report-stat-card report-stat-card--warning">
                <span>Pedidos cancelados</span>
                <strong>{report.summary.total_cancelled_orders}</strong>
              </article>
            </div>

            <div className="reports-by-status">
              <h3>Pedidos por estado</h3>
              <div className="reports-by-status__grid">
                {report.summary.orders_by_status.map((item) => (
                  <div key={item.status} className="status-chip">
                    <span className="status-chip__label">
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    <strong className="status-chip__count">{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="reports-columns">
            <section className="reports-table-section">
              <h2>Productos más vendidos</h2>
              {report.top_products.length === 0 ? (
                <p className="reports-empty">Sin datos en este período.</p>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Cantidad vendida</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_products.map((p, i) => (
                      <tr key={p.product_id}>
                        <td>{i + 1}</td>
                        <td>{p.product_name}</td>
                        <td>{p.total_quantity}</td>
                        <td>{formatCurrency(p.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="reports-table-section">
              <h2>Clientes con mayor volumen</h2>
              {report.top_customers.length === 0 ? (
                <p className="reports-empty">Sin datos en este período.</p>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>Pedidos</th>
                      <th>Total gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_customers.map((c, i) => (
                      <tr key={c.customer_id}>
                        <td>{i + 1}</td>
                        <td>{c.customer_name}</td>
                        <td>{c.total_orders}</td>
                        <td>{formatCurrency(c.total_spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <section className="reports-table-section">
            <h2>Pedidos cancelados</h2>
            {report.cancelled_orders.length === 0 ? (
              <p className="reports-empty">No hay pedidos cancelados en este período.</p>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Motivo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cancelled_orders.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.cancellation_reason || "—"}</td>
                      <td>{formatDate(o.cancelled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default Reports;
