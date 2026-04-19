import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/products/ProductCard";
import EmptyState from "../components/ui/EmptyState";

function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchProducts() {
      try {
        const response = await api.get("/products/products/");
        if (!ignore) {
          setProducts(response.data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("No se pudieron cargar los productos.");
        }
      }
    }

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Productos</h1>
        <p>Consulta el catálogo disponible para el sistema.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="No hay productos disponibles para mostrar."
        />
      ) : (
        <div className="grid-cards">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;