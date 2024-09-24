import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';
import LoginForm from './Forms/LoginForm';
import RegisterForm from './Forms/RegisterForm';
import ProductList from './Forms/ProductList';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import doll1 from './images/1.png'; // Images for NavBar.
import doll2 from './images/2.png';
import doll3 from './images/3.png';
import doll4 from './images/4.png';

function App() {
  // State variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [response, setResponse] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [enlargedImg, setEnlargedImg] = useState(null); // No image is elarged now.
  const [showForms, setShowForms] = useState(false);

  // Handle user registration
  const handleRegister = async () => {
    try {
      const result = await axios.post('http://localhost:5000/register', {
        username,
        password,
      });
      setResponse(result.data.message); // Response from server - registeration managed or failed.
    } catch (error) {
      console.error('Registration error:', error);
      setResponse('Registration failed');
    }
  };

  // Handle user login
  const handleLogin = async () => {
    try {
      const result = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });
      // Keep the needed returned values from the server.
      setToken(result.data.token); // Token for authorized future requests.
      setIsAdmin(result.data.isAdmin); // For getting Admin dashbord.
      setResponse('Logged in successfully!');

      // Load open order if exists
      if (result.data.openOrder) {
        setCart(result.data.openOrder.items.map(item => ({ // Fill up the cart.
          product: item.product,
          quantity: item.quantity
        })));
      } else {
        setCart([]); // Empty cart.
      }
    } catch (error) {
      console.error('Login error:', error);
      setResponse('Invalid credentials');
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/save-cart', { cart, status: 'Open Order' }, {
        headers: { Authorization: `Bearer ${token}` } // Add the token for being athorized by the server.
      });
      // Clear user data
      // For next user.
      setCart([]);
      setUserOrders([]);
      setAdminOrders([]);
      setToken(null);
      setIsAdmin(false);
      setResponse('Logged out successfully');
      setCurrentPage('home');
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  // Fetch user orders
  const handleViewUserOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/user-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserOrders(response.data); // All users.
      openOrdersWindow(response.data, 'My Orders');
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  // Fetch admin orders
  const handleViewAdminOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminOrders(response.data);
      openOrdersWindow(response.data, 'Customer Orders');
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    }
  };

  // Delete all orders
  const handleDeleteAllOrders = async () => {
    try {
      await axios.delete('http://localhost:5000/delete-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminOrders([]);
      alert('All orders have been deleted successfully');
    } catch (error) {
      console.error('Error deleting orders:', error);
    }
  };

  // Open new window to display orders
  const openOrdersWindow = (orders, title) => {
    const ordersWindow = window.open('', '_blank');
    if (!ordersWindow) {
      console.error('Failed to open new window');
      return;
    }

    const content = `
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .order-item { border: 1px solid #ccc; padding: 20px; margin-bottom: 10px; border-radius: 10px; }
          .order-products { display: flex; flex-wrap: wrap; }
          .order-product { margin-right: 10px; margin-bottom: 10px; }
          .order-product img { width: 50px; height: 50px; border-radius: 5px; object-fit: cover; }
          .order-header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${orders.map(order => `
          <div class="order-item">
            <div class="order-header">Order ID: ${order._id}</div>
            <div>Customer: ${order.userName}</div>
            <div>Status: ${order.status}</div>
            <div>Total: $${order.total.toFixed(2)}</div>
            <div class="order-products">
              ${order.items.map(item => `
                <div class="order-product">
                  <img src="${item.product.imageUrl}" alt="${item.product.name}" />
                  <div>${item.product.name}</div>
                  <div>Quantity: ${item.quantity}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    ordersWindow.document.write(content);
    ordersWindow.document.close();
  };

  // Handle image click to enlarge
  const handleImageClick = (src) => {
    setEnlargedImg(src); // Current image shouold get bigger.
  };

  // Close enlarged image
  const handleCloseClick = () => {
    setEnlargedImg(null);
  };

  return (
    <div className={token ? "app-container" : "background-container"}>
      <nav className="navbar">
        <button onClick={() => setCurrentPage('home')} className="nav-link">Home</button>
        <button onClick={() => setCurrentPage('about')} className="nav-link">About Us</button>
        <button onClick={() => setCurrentPage('contact')} className="nav-link">Contact</button>
        <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
        <div className="porcelain-dolls-images">
          <img src={doll1} className="navbar-doll-img" alt="Porcelain Doll 1" onClick={() => handleImageClick(doll1)} />
          <img src={doll2} className="navbar-doll-img" alt="Porcelain Doll 2" onClick={() => handleImageClick(doll2)} />
          <img src={doll3} className="navbar-doll-img" alt="Porcelain Doll 3" onClick={() => handleImageClick(doll3)} />
          <img src={doll4} className="navbar-doll-img" alt="Porcelain Doll 4" onClick={() => handleImageClick(doll4)} />
        </div>
      </nav>

      {enlargedImg && (
        <>
          <div className="overlay" onClick={handleCloseClick}></div>
          <img src={enlargedImg} className="enlarged-img" alt="Enlarged Porcelain Doll" />
          <button className="close-btn" onClick={handleCloseClick}>X</button>
        </>
      )}

      <h1 className="title">{isAdmin ? 'Admin Dashboard' : 'PORCELAIN DOLLS'}</h1>
      {currentPage === 'home' && (
        !token ? (
          <>
            <button className="get-started-btn" onClick={() => setShowForms(!showForms)}>Get Started</button>
            {showForms && (
              <div className="forms-container">
                <RegisterForm
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  handleRegister={handleRegister}
                />
                <LoginForm
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  handleLogin={handleLogin}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <ProductList token={token} isAdmin={isAdmin} cart={cart} setCart={setCart} handleImageClick={handleImageClick} />
            <button onClick={handleViewUserOrders} className="btn">My Orders</button>
            {isAdmin && (
              <>
                <button onClick={handleViewAdminOrders} className="btn">Customer Orders</button>
                <button onClick={handleDeleteAllOrders} className="btn">Delete All Orders</button>
              </>
            )}
          </>
        )
      )}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'contact' && <ContactPage />}
      <p className="response-message">{response}</p>
    </div>
  );
}

export default App;
