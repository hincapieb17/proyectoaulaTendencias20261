function ProductCard({ product, onAdd }) {
  const isUnavailable = product.stock <= 0 || product.status === "agotado";

  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p><strong>SKU:</strong> {product.sku}</p>
      <p><strong>Precio:</strong> ${product.price}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <p><strong>Estado:</strong> {product.status}</p>

      {onAdd && (
        <button
          className="btn btn-primary"
          onClick={() => onAdd(product)}
          disabled={isUnavailable}
          style={{ opacity: isUnavailable ? 0.5 : 1 }}
        >
          {isUnavailable ? "Agotado" : "Agregar al pedido"}
        </button>
      )}
    </div>
  );
}

export default ProductCard;