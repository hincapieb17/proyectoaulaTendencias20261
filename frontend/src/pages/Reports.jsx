import { useState } from "react";
import api from "../services/api";
import "../styles/reports.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    const period =
      startDate || endDate
        ? `${startDate || "—"} al ${endDate || "—"}`
        : "Todo el tiempo";

    // Encabezado
    doc.setFillColor(15, 52, 96);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Ventas", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${period}`, 14, 21);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-CO")}`, pageW - 14, 21, { align: "right" });

    // Resumen
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen del período", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [["Total vendido", "Pedidos entregados", "Pedidos cancelados"]],
      body: [[
        formatCurrency(report.summary.total_sales),
        report.summary.total_delivered_orders,
        report.summary.total_cancelled_orders,
      ]],
      headStyles: { fillColor: [15, 52, 96], fontStyle: "bold" },
      styles: { fontSize: 10, halign: "center" },
    });

    // Pedidos por estado
    if (report.summary.orders_by_status.length > 0) {
      doc.setTextColor(15, 52, 96);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos por estado", 14, doc.lastAutoTable.finalY + 12);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [["Estado", "Cantidad"]],
        body: report.summary.orders_by_status.map((s) => [
          STATUS_LABELS[s.status] || s.status,
          s.count,
        ]),
        headStyles: { fillColor: [15, 52, 96] },
        styles: { fontSize: 9 },
      });
    }

    // Productos más vendidos
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Productos más vendidos", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["#", "Producto", "Cantidad vendida", "Ingresos"]],
      body: report.top_products.length > 0
        ? report.top_products.map((p, i) => [
            i + 1,
            p.product_name,
            p.total_quantity,
            formatCurrency(p.total_revenue),
          ])
        : [["—", "Sin datos en este período", "", ""]],
      headStyles: { fillColor: [15, 52, 96] },
      styles: { fontSize: 9 },
    });

    // Clientes top
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Clientes con mayor volumen", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["#", "Cliente", "Pedidos", "Total gastado"]],
      body: report.top_customers.length > 0
        ? report.top_customers.map((c, i) => [
            i + 1,
            c.customer_name,
            c.total_orders,
            formatCurrency(c.total_spent),
          ])
        : [["—", "Sin datos en este período", "", ""]],
      headStyles: { fillColor: [15, 52, 96] },
      styles: { fontSize: 9 },
    });

    // Pedidos cancelados
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Pedidos cancelados", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Pedido", "Cliente", "Motivo", "Fecha"]],
      body: report.cancelled_orders.length > 0
        ? report.cancelled_orders.map((o) => [
            `#${o.id}`,
            o.customer_name,
            o.cancellation_reason || "—",
            formatDate(o.cancelled_at),
          ])
        : [["—", "No hay pedidos cancelados en este período", "", ""]],
      headStyles: { fillColor: [233, 69, 96] },
      styles: { fontSize: 9 },
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`reporte-ventas-${new Date().toISOString().slice(0, 10)}.pdf`);
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
        {report && (
          <button type="button" className="btn-pdf" onClick={downloadPDF}>
            ↓ Descargar PDF
          </button>
        )}
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
