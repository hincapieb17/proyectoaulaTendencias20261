import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

function CreateOrder() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchInitialData() {
      try {
        const [productsResponse, customersResponse] = await Promise.all([
          api.get("/products/products/"),
          api.get("/customers/customers/"),
        ]);

        if (!ignore) {
          setProducts(productsResponse.data);
          setCustomers(customersResponse.data);

          if (customersResponse.data.length === 1) {
            setSelectedCustomer(customersResponse.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("No se pudieron cargar los datos iniciales.");
        }
      }
    }

    fetchInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const addProductToOrder = (product) => {
    const existing = items.find((item) => item.product === product.id);

    if (existing) {
      setItems(
        items.map((item) =>
          item.product === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    setItems([
      ...items,
      {
        product: product.id,
        product_name: product.name,
        quantity: 1,
      },
    ]);
  };

  const updateQuantity = (productId, quantity) => {
    setItems(
      items.map((item) =>
        item.product === productId
          ? { ...item, quantity: Number(quantity) }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems(items.filter((item) => item.product !== productId));
  };

  const createOrder = async () => {
    setMessage("");
    setError("");

    if (!selectedCustomer) {
      setError("Debes seleccionar un cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Debes agregar al menos un producto.");
      return;
    }

    try {
      await api.post("/orders/orders/", {
        customer: Number(selectedCustomer),
        items: items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      });

      setMessage("Pedido creado correctamente.");
      setItems([]);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el pedido.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Crear pedido</h1>
        <p>Selecciona un cliente y agrega productos al pedido.</p>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <label>Cliente</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
        >
          <option value="">Selecciona un cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name}
            </option>
          ))}
        </select>
      </div>

      <h2>Productos</h2>
      <div className="grid-cards">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={addProductToOrder}
          />
        ))}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Ítems del pedido</h2>

        {items.length === 0 ? (
          <p>No has agregado productos al pedido.</p>
        ) : (
          <div className="grid-cards">
            {items.map((item) => (
              <div className="card" key={item.product}>
                <h3>{item.product_name}</h3>

                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product, e.target.value)}
                />

                <button
                  className="btn btn-danger"
                  style={{ marginTop: "1rem" }}
                  onClick={() => removeItem(item.product)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-primary" onClick={createOrder}>
            Guardar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;