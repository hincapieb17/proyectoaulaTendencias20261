import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../styles/products.css";

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

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active).length,
    [categories]
  );

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "activo").length,
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length,
    [products]
  );

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
      setError("No se pudieron cargar los productos.");
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

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      is_active: true,
    });
    setEditingCategoryId(null);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      sku: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      status: "activo",
    });
    setEditingProductId(null);
  };

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

  const handleEditCategory = (category) => {
    clearAlerts();
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      is_active: Boolean(category.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditProduct = (product) => {
    clearAlerts();
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "",
      price: product.price || "",
      stock: product.stock || "",
      status: product.status || "activo",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    clearAlerts();

    try {
      if (editingCategoryId) {
        await api.put(`/products/categories/${editingCategoryId}/`, categoryForm);
        setMessage("Categoría actualizada correctamente.");
      } else {
        await api.post("/products/categories/", categoryForm);
        setMessage("Categoría creada correctamente.");
      }

      resetCategoryForm();
      await loadData();
    } catch (err) {
      console.error(err);
      const data = err?.response?.data;

      if (data?.name?.[0]) {
        setError(data.name[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("No se pudo guardar la categoría.");
      }
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    clearAlerts();

    const payload = {
      ...productForm,
      category: Number(productForm.category),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
    };

    try {
      if (editingProductId) {
        await api.put(`/products/products/${editingProductId}/`, payload);
        setMessage("Producto actualizado correctamente.");
      } else {
        await api.post("/products/products/", payload);
        setMessage("Producto creado correctamente.");
      }

      resetProductForm();
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
        setError("No se pudo guardar el producto.");
      }
    }
  };

  const getProductStatusClass = (status) => {
    switch (status) {
      case "activo":
        return "products-badge products-badge--success";
      case "agotado":
        return "products-badge products-badge--danger";
      case "descontinuado":
        return "products-badge products-badge--neutral";
      default:
        return "products-badge";
    }
  };

  const getCategoryStatusClass = (isActive) => {
    return isActive
      ? "products-badge products-badge--success"
      : "products-badge products-badge--neutral";
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-loading">Cargando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <section className="products-header">
        <div className="products-header__left">
          <span className="products-header__label">Módulo de catálogo</span>
          <h1>Gestión de productos</h1>
          <p>
            Consulta el catálogo disponible y administra productos y categorías
            desde una interfaz clara, sobria y profesional.
          </p>
        </div>

        <div className="products-stats">
          <div className="products-stat-card">
            <span>Total productos</span>
            <strong>{products.length}</strong>
          </div>
          <div className="products-stat-card">
            <span>Categorías activas</span>
            <strong>{activeCategories}</strong>
          </div>
          <div className="products-stat-card">
            <span>Productos activos</span>
            <strong>{activeProducts}</strong>
          </div>
          <div className="products-stat-card">
            <span>Stock bajo</span>
            <strong>{lowStockProducts}</strong>
          </div>
        </div>
      </section>

      {message && <div className="products-alert products-alert--success">{message}</div>}
      {error && <div className="products-alert products-alert--error">{error}</div>}

      {isAdmin && (
        <section className="products-admin">
          <div className="products-section-title">
            <h2>Panel de administración</h2>
            <p>Solo el administrador puede crear y editar categorías y productos.</p>
          </div>

          <div className="products-admin-grid">
            <article className="products-panel">
              <div className="products-panel__header">
                <h3>{editingCategoryId ? "Editar categoría" : "Nueva categoría"}</h3>
                <p>Define la estructura del catálogo.</p>
              </div>

              <form className="products-form" onSubmit={handleSubmitCategory}>
                <div className="products-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryChange}
                    required
                  />
                </div>

                <div className="products-field">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    value={categoryForm.description}
                    onChange={handleCategoryChange}
                    rows="4"
                  />
                </div>

                <label className="products-check">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={categoryForm.is_active}
                    onChange={handleCategoryChange}
                  />
                  Categoría activa
                </label>

                <div className="products-actions">
                  <button type="submit" className="products-btn products-btn--primary">
                    {editingCategoryId ? "Guardar cambios" : "Crear categoría"}
                  </button>

                  {editingCategoryId && (
                    <button
                      type="button"
                      className="products-btn products-btn--secondary"
                      onClick={resetCategoryForm}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </article>

            <article className="products-panel">
              <div className="products-panel__header">
                <h3>{editingProductId ? "Editar producto" : "Nuevo producto"}</h3>
                <p>Registra o actualiza productos del inventario.</p>
              </div>

              <form className="products-form" onSubmit={handleSubmitProduct}>
                <div className="products-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductChange}
                    required
                  />
                </div>

                <div className="products-field">
                  <label>SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={productForm.sku}
                    onChange={handleProductChange}
                    required
                  />
                </div>

                <div className="products-field">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductChange}
                    rows="4"
                    required
                  />
                </div>

                <div className="products-field">
                  <label>Categoría</label>
                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="products-inline-fields">
                  <div className="products-field">
                    <label>Precio</label>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleProductChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="products-field">
                    <label>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={productForm.stock}
                      onChange={handleProductChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="products-field">
                  <label>Estado</label>
                  <select
                    name="status"
                    value={productForm.status}
                    onChange={handleProductChange}
                  >
                    <option value="activo">Activo</option>
                    <option value="agotado">Agotado</option>
                    <option value="descontinuado">Descontinuado</option>
                  </select>
                </div>

                <div className="products-actions">
                  <button type="submit" className="products-btn products-btn--primary">
                    {editingProductId ? "Guardar cambios" : "Crear producto"}
                  </button>

                  {editingProductId && (
                    <button
                      type="button"
                      className="products-btn products-btn--secondary"
                      onClick={resetProductForm}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </article>
          </div>

          <div className="products-manage-grid">
            <article className="products-panel">
              <div className="products-panel__header">
                <h3>Categorías existentes</h3>
                <p>Edita categorías registradas.</p>
              </div>

              <div className="products-list">
                {categories.length === 0 ? (
                  <div className="products-empty">No hay categorías registradas.</div>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="products-list-item">
                      <div className="products-list-item__info">
                        <strong>{category.name}</strong>
                        <p>{category.description || "Sin descripción."}</p>
                      </div>

                      <div className="products-list-item__side">
                        <span className={getCategoryStatusClass(category.is_active)}>
                          {category.is_active ? "Activa" : "Inactiva"}
                        </span>
                        <button
                          className="products-btn products-btn--secondary"
                          onClick={() => handleEditCategory(category)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="products-panel">
              <div className="products-panel__header">
                <h3>Productos existentes</h3>
                <p>Edita productos ya creados.</p>
              </div>

              <div className="products-list">
                {products.length === 0 ? (
                  <div className="products-empty">No hay productos registrados.</div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="products-list-item">
                      <div className="products-list-item__info">
                        <strong>{product.name}</strong>
                        <p>
                          SKU: {product.sku} · Stock: {product.stock} · Precio: ${product.price}
                        </p>
                      </div>

                      <div className="products-list-item__side">
                        <span className={getProductStatusClass(product.status)}>
                          {product.status}
                        </span>
                        <button
                          className="products-btn products-btn--secondary"
                          onClick={() => handleEditProduct(product)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      <section className="products-catalog">
        <div className="products-section-title">
          <h2>Catálogo disponible</h2>
          <p>Vista limpia y amigable de los productos disponibles en la plataforma.</p>
        </div>

        {products.length === 0 ? (
          <div className="products-empty">Todavía no hay productos registrados.</div>
        ) : (
          <div className="products-catalog-grid">
            {products.map((product) => (
              <article key={product.id} className="products-card">
                <div className="products-card__top">
                  <span className={getProductStatusClass(product.status)}>
                    {product.status}
                  </span>
                </div>

                <h3>{product.name}</h3>
                <p className="products-card__desc">{product.description}</p>

                <div className="products-card__meta">
                  <span>SKU: {product.sku}</span>
                  <span>Stock: {product.stock}</span>
                </div>

                <div className="products-card__price">${product.price}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;