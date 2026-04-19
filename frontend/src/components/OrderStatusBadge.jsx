function OrderStatusBadge({ status }) {
  const statusMap = {
    draft: "badge badge-gray",
    confirmed: "badge badge-blue",
    preparing: "badge badge-yellow",
    shipped: "badge badge-purple",
    delivered: "badge badge-green",
    cancelled: "badge badge-red",
  };

  return <span className={statusMap[status] || "badge"}>{status}</span>;
}

export default OrderStatusBadge;