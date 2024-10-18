import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3001/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    }
  };

  const handleAddProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('category', newProduct.category);
      formData.append('price', newProduct.price);
      formData.append('stock', newProduct.stock);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post('http://localhost:3001/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Product added successfully');
      fetchProducts();
      setNewProduct({ name: '', category: '', price: '', stock: '' });
      setImageFile(null);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product, price: product.price.toString(), stock: product.stock.toString() });
  };

  const handleUpdateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editingProduct.name);
      formData.append('category', editingProduct.category);
      formData.append('price', editingProduct.price);
      formData.append('stock', editingProduct.stock);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.put(`http://localhost:3001/admin/products/${editingProduct.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Product updated successfully');
      fetchProducts();
      setEditingProduct(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/admin/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product');
    }
  };

  const handleLogout = () => {
    // Implementa la funcionalidad de logout aquí
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onLogout={handleLogout} />
      <div className="container mx-auto p-4">
        {!editingProduct ? (
          <ProductForm
            product={newProduct}
            onSubmit={handleAddProduct}
            onChange={setNewProduct}
            setImageFile={setImageFile}
          />
        ) : (
          <ProductForm
            product={editingProduct}
            onSubmit={handleUpdateProduct}
            onCancel={() => setEditingProduct(null)}
            onChange={setEditingProduct}
            setImageFile={setImageFile}
          />
        )}
        <ProductList
          products={products}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
        <OrderList orders={orders} />
      </div>
    </div>
  );
}

function AdminHeader({ onLogout }) {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function ProductForm({ product, onSubmit, onCancel, onChange, setImageFile }) {
  const isEditing = !!product.id;
  return (
    <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Product Name"
          value={product.name || ''}
          onChange={(e) => onChange({ ...product, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={product.category || ''}
          onChange={(e) => onChange({ ...product, category: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={product.price || ''}
          onChange={(e) => onChange({ ...product, price: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Stock"
          value={product.stock || ''}
          onChange={(e) => onChange({ ...product, stock: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="file"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="border p-2 rounded"
        />
      </div>
      <div className="flex mt-4">
        <button
          onClick={onSubmit}
          className={`${
            isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } text-white px-4 py-2 rounded-md shadow-md transition`}
        >
          {isEditing ? 'Update Product' : 'Add Product'}
        </button>
        {isEditing && (
          <button
            onClick={onCancel}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function ProductList({ products, onEditProduct, onDeleteProduct }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Manage Products</h2>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 bg-white rounded-lg shadow-lg">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-cover mb-4 rounded"
                />
              )}
              <div className="mb-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-gray-600">{product.category}</p>
                <p className="text-gray-800 font-semibold">${product.price}</p>
                <p className="text-gray-600">Stock: {product.stock}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onEditProduct(product)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteProduct(product.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No products available.</p>
      )}
    </div>
  );
}

function OrderList({ orders }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Customer Orders</h2>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Order ID</th>
                  <th className="px-4 py-2 border-b">Customer</th>
                  <th className="px-4 py-2 border-b">Product</th>
                  <th className="px-4 py-2 border-b">Quantity</th>
                  <th className="px-4 py-2 border-b">Item Price</th>
                  <th className="px-4 py-2 border-b">Total Price</th>
                  <th className="px-4 py-2 border-b">Payment Method</th>
                  <th className="px-4 py-2 border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={`${order.order_id}-${order.product_id}`}>
                    <td className="px-4 py-2 border-b">{order.order_id}</td>
                    <td className="px-4 py-2 border-b">{order.customer_name}</td>
                    <td className="px-4 py-2 border-b">{order.product_name}</td>
                    <td className="px-4 py-2 border-b">{order.quantity}</td>
                    <td className="px-4 py-2 border-b">${order.item_price}</td>
                    <td className="px-4 py-2 border-b">${order.total_price}</td>
                    <td className="px-4 py-2 border-b">{order.payment_method}</td>
                    <td className="px-4 py-2 border-b">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No orders available.</p>
        )}
      </div>
    </div>
  );
}
