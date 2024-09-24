import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faShoppingCart, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import ProductForm from './ProductForm';
import defaultImage from './1.webp';

function ProductList({ token, isAdmin, cart, setCart }) {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [total, setTotal] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cardDetails, setCardDetails] = useState({ cardNumber: '', expiry: '', cvc: '' });
    const [enlargedImg, setEnlargedImg] = useState(null);  // Added state for enlarged image

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        calculateTotal();
    }, [cart]);

    const fetchProducts = async () => {
        const response = await axios.get('http://localhost:5000/products', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data.map(product => ({
            ...product,
            imageUrl: product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`
        })));
    };

    const handleAddToCart = (product) => {
        const existingItem = cart.find(item => item.product._id === product._id);
        if (existingItem) {
            setCart(cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const handleRemoveFromCart = (product) => {
        const existingItem = cart.find(item => item.product._id === product._id);
        if (existingItem.quantity > 1) {
            setCart(cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity - 1 } : item));
        } else {
            setCart(cart.filter(item => item.product._id !== product._id));
        }
    };

    const calculateTotal = () => {
        const total = cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
        setTotal(total);
    };

    const handleDelete = async (id) => {
        await axios.delete(`http://localhost:5000/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
        setCart(cart.filter(item => item.product._id !== id));
    };

    const handleOrder = () => {
        setShowPaymentModal(true);
    };

    const completeOrder = async () => {
        if (!cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvc) {
            alert('Please fill in all credit card details correctly.');
            return;
        }
        try {
            await axios.post('http://localhost:5000/complete-order', { cart, status: 'Ordered' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowPaymentModal(false);
            setCart([]);
            alert('Order completed successfully');
        } catch (error) {
            console.error('Error completing order:', error);
        }
    };

    const updateCardDetails = (field, value) => {
        setCardDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleImageClick = (src) => {
        setEnlargedImg(src);
    };

    const handleCloseClick = () => {
        setEnlargedImg(null);
    };

    return (
        <div>
            <h2>Products</h2>
            {cart.length > 0 && (
                <>
                    <div className="cart-summary">
                        <FontAwesomeIcon icon={faShoppingCart} /> Cart Total: ${total.toFixed(2)}
                        <button className="btn" onClick={handleOrder}>Order</button>
                    </div>
                    <div className="cart-container">
                        <h3>Your Cart</h3>
                        {cart.map(item => (
                            <div key={item.product._id} className="cart-item">
                                <img src={item.product.imageUrl || defaultImage} className="cart-product-image" alt="Product" />
                                <div className="cart-details">
                                    {item.product.name} - ${item.product.price.toFixed(2)} x {item.quantity}
                                    <FontAwesomeIcon icon={faPlus} onClick={() => handleAddToCart(item.product)} className="icon-plus" />
                                    <FontAwesomeIcon icon={faMinus} onClick={() => handleRemoveFromCart(item.product)} className="icon-minus" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {showPaymentModal && (
                <div className="payment-modal">
                    <h3>Payment Details</h3>
                    <p>Enter your credit card information:</p>
                    <input type="text" placeholder="Card Number" className="input-field" value={cardDetails.cardNumber} onChange={(e) => updateCardDetails('cardNumber', e.target.value)} />
                    <input type="text" placeholder="MM/YY" className="input-field" value={cardDetails.expiry} onChange={(e) => updateCardDetails('expiry', e.target.value)} />
                    <input type="text" placeholder="CVC" className="input-field" value={cardDetails.cvc} onChange={(e) => updateCardDetails('cvc', e.target.value)} />
                    <button className="btn" onClick={completeOrder} disabled={!cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvc}>Pay</button>
                    <button className="btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                </div>
            )}
            {isAdmin && !selectedProduct && (
                <button className="add-new-product-btn" onClick={() => setSelectedProduct({})}>Add New Product</button>
            )}
            {selectedProduct ? (
                <ProductForm
                    product={selectedProduct}
                    onSave={() => {
                        setSelectedProduct(null);
                        fetchProducts();
                    }}
                    onCancel={() => setSelectedProduct(null)}
                    token={token}
                />
            ) : (
                products.map(product => (
                    <div key={product._id} className="product-item">
                        <img src={product.imageUrl || defaultImage} className="product-image" onClick={() => handleImageClick(product.imageUrl || defaultImage)} alt="Product" />
                        <div className="product-info">
                            <p>{product.name} - ${product.price.toFixed(2)}</p>
                            <button onClick={() => handleAddToCart(product)} className={`btn ${product.added ? 'btn-added' : ''}`}>
                                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                            </button>
                            {isAdmin && (
                                <>
                                    <FontAwesomeIcon icon={faEdit} onClick={() => setSelectedProduct(product)} className="icon-edit" />
                                    <FontAwesomeIcon icon={faTrash} onClick={() => handleDelete(product._id)} className="icon-delete" />
                                </>
                            )}
                        </div>
                        <div className="product-thumbnails">
                            <img src={product.imageUrl || defaultImage} className="product-thumbnail" onClick={() => handleImageClick(product.imageUrl || defaultImage)} alt="Product thumbnail" />
                        </div>
                    </div>
                ))
            )}
            {enlargedImg && (
                <>
                    <div className="overlay" onClick={handleCloseClick}></div>
                    <img src={enlargedImg} className="enlarged-img" alt="Enlarged Porcelain Doll" />
                    <button className="close-btn" onClick={handleCloseClick}>X</button>
                </>
            )}
        </div>
    );
}

export default ProductList;
