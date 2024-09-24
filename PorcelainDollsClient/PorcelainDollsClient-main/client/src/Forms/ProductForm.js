import React, { useState } from 'react';
import axios from 'axios';

function ProductForm({ product, onSave, onCancel, token }) {
  const [name, setName] = useState(product ? product.name : '');
  const [price, setPrice] = useState(product ? product.price : '');
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(); // An object that collects product details andallowes sending HTTP requests.
    formData.append('name', name);
    formData.append('price', price);
    if (image) {
      formData.append('image', image);
    }

    const config = { // Configuration.
      headers: { 
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    };
    try {
      if (product && product._id) {
        await axios.put(`http://localhost:5000/products/${product._id}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/products', formData, config);
      }
      onSave();
    } catch (error) {
      console.error('Error saving the product:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Product Name"
        required
        className="input-field"
      />
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Price"
        required
        className="input-field"
      />
      <input
        type="file"
        onChange={e => setImage(e.target.files[0])}
        className="file-input"
      />
      <div className="flex justify-between">
        <button type="submit" className="btn">Save Product</button>
        <button type="button" onClick={onCancel} className="btn">Cancel</button>
      </div>
    </form>
  );
}

export default ProductForm;
