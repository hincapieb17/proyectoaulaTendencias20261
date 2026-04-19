function ProductCard({ product, onAdd }) {
  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p><strong>SKU:</strong> {product.sku}</p>
      <p><strong>Precio:</strong> ${product.price}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <p><strong>Estado:</strong> {product.status}</p>

      {onAdd && (
        <button className="btn btn-primary" onClick={() => onAdd(product)}>
          Agregar al pedido
        </button>
      )}
    </div>
  );
}

export default ProductCard;