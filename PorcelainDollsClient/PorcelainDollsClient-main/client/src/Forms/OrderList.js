import React from 'react';

function OrderList({ orders }) {
  return (
    <div className="order-list">
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} className="order-item">
            <h3>Order ID: {order._id}</h3>
            <p>Status: {order.status}</p>
            <ul>
              {order.items.map(item => (
                <li key={item.product._id}>
                  {item.product.name} - Quantity: {item.quantity}
                </li>
              ))}
            </ul>
            <p>Total: ${order.total.toFixed(2)}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default OrderList;
