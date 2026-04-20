import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/products/ProductCard";
import EmptyState from "../components/ui/EmptyState";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    status: "activo",
  });

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, profileRes] = await Promise.all([
        api.get("/products/products/"),
        api.get("/products/categories/"),
        api.get("/users/profile/"),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setIsAdmin(profileRes.data?.role === "admin");
    } catch (err) {
      console.error(err);
      setError("No se pudieron recargar los datos.");
    }
  };

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [productsRes, categoriesRes, profileRes] = await Promise.all([
          api.get("/products/products/"),
          api.get("/products/categories/"),
          api.get("/users/profile/"),
        ]);

        if (!ignore) {
          setProducts(productsRes.data);
          setCategories(categoriesRes.data);
          setIsAdmin(profileRes.data?.role === "admin");
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCategoryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setCategoryForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;

    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/products/categories/", categoryForm);

      setMessage("Categoría creada correctamente.");

      setCategoryForm({
        name: "",
        description: "",
        is_active: true,
      });

      await loadData();
    } catch (err) {
      console.error(err);
      const data = err?.response?.data;

      if (data?.name?.[0]) {
        setError(data.name[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("No se pudo crear la categoría.");
      }
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/products/products/", {
        ...productForm,
        category: Number(productForm.category),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      });

      setMessage("Producto creado correctamente.");

      setProductForm({
        name: "",
        sku: "",
        description: "",
        category: "",
        price: "",
        stock: "",
        status: "activo",
      });

      await loadData();
    } catch (err) {
      console.error(err);
      const data = err?.response?.data;

      if (data?.sku?.[0]) {
        setError(data.sku[0]);
      } else if (data?.name?.[0]) {
        setError(data.name[0]);
      } else if (data?.category?.[0]) {
        setError(data.category[0]);
      } else if (data?.price?.[0]) {
        setError(data.price[0]);
      } else if (data?.stock?.[0]) {
        setError(data.stock[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("No se pudo crear el producto.");
      }
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "30px auto" }}>
      <h1>Productos</h1>
      <p>Consulta el catálogo disponible para el sistema.</p>

      {message && (
        <p style={{ color: "green", marginBottom: "12px" }}>{message}</p>
      )}

      {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
      )}

      {isAdmin && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <section
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "#fff",
            }}
          >
            <h2>Crear categoría</h2>

            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: "12px" }}>
                <label>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryChange}
                  required
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryChange}
                  rows="4"
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={categoryForm.is_active}
                    onChange={handleCategoryChange}
                  />
                  Categoría activa
                </label>
              </div>

              <button type="submit">Crear categoría</button>
            </form>
          </section>

          <section
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "#fff",
            }}
          >
            <h2>Crear producto</h2>

            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  required
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={productForm.sku}
                  onChange={handleProductChange}
                  required
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductChange}
                  rows="4"
                  required
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Categoría</label>
                <select
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  required
                  style={{ width: "100%", padding: "10px" }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Precio</label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductChange}
                  required
                  min="0"
                  step="0.01"
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={productForm.stock}
                  onChange={handleProductChange}
                  required
                  min="0"
                  style={{ width: "100%", padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label>Estado</label>
                <select
                  name="status"
                  value={productForm.status}
                  onChange={handleProductChange}
                  style={{ width: "100%", padding: "10px" }}
                >
                  <option value="activo">Activo</option>
                  <option value="agotado">Agotado</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>

              <button type="submit">Crear producto</button>
            </form>
          </section>
        </div>
      )}

      {loading ? (
        <p>Cargando productos...</p>
      ) : products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Todavía no hay productos registrados."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;