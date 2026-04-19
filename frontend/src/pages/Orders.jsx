import { useEffect, useState } from "react";
import api from "../services/api";
import OrderStatusBadge from "../components/OrderStatusBadge";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchOrders() {
      try {
        const response = await api.get("/orders/orders/");

        if (!ignore) {
          setOrders(response.data);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("No se pudieron cargar los pedidos.");
        }
      }
    }

    fetchOrders();

    return () => {
      ignore = true;
    };
  }, []);

  const reloadOrders = async () => {
    try {
      const response = await api.get("/orders/orders/");
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los pedidos.");
    }
  };

  const confirmOrder = async (id) => {
    setMessage("");
    setError("");

    try {
      await api.post(`/orders/orders/${id}/confirm/`);
      setMessage("Pedido confirmado correctamente.");
      await reloadOrders();
    } catch (err) {
      console.error(err);
      setError("No se pudo confirmar el pedido.");
    }
  };

  const changeStatus = async (id, status) => {
    setMessage("");
    setError("");

    try {
      await api.post(`/orders/orders/${id}/change_status/`, { status });
      setMessage(`Estado cambiado a ${status}.`);
      await reloadOrders();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del pedido.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pedidos</h1>
        <p>Consulta y administra los pedidos registrados.</p>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="grid-cards">
        {orders.map((order) => (
          <div className="card" key={order.id}>
            <h3>Pedido #{order.id}</h3>
            <p><strong>Cliente:</strong> {order.customer_name}</p>
            <p><strong>Subtotal:</strong> ${order.subtotal}</p>
            <p><strong>Descuento:</strong> ${order.discount}</p>
            <p><strong>Total:</strong> ${order.total}</p>
            <p><strong>Estado:</strong> <OrderStatusBadge status={order.status} /></p>

            <div>
              <h4>Ítems</h4>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product_name} x {item.quantity} - ${item.subtotal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="actions-row">
              {order.status === "draft" && (
                <button className="btn btn-primary" onClick={() => confirmOrder(order.id)}>
                  Confirmar
                </button>
              )}

              {order.status === "confirmed" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => changeStatus(order.id, "preparing")}
                >
                  Pasar a preparación
                </button>
              )}

              {order.status === "preparing" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => changeStatus(order.id, "shipped")}
                >
                  Marcar como enviado
                </button>
              )}

              {order.status === "shipped" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => changeStatus(order.id, "delivered")}
                >
                  Marcar como entregado
                </button>
              )}

              {(order.status === "draft" ||
                order.status === "confirmed" ||
                order.status === "preparing") && (
                <button
                  className="btn btn-danger"
                  onClick={() => changeStatus(order.id, "cancelled")}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;