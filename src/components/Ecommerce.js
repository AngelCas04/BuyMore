import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { motion } from 'framer-motion'; // Importamos Framer Motion
import Header from './ui/Header';
import Sidebar from './ui/Sidebar';
import ProductGrid from './ui/ProductGrid';
import LoginModal from './ui/LoginModal';
import RegisterModal from './ui/RegisterModal';
import CartModal from './ui/CartModal';
import Profile from './Profile';

const initialCategories = [
  "All", "Trending Now", "New Season", "Dresses", "Tops", "Shoes", "Bags"
];

export default function Ecommerce() {
  const [categories] = useState(initialCategories);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    loadUserFromLocalStorage();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products');
    }
  };

  const loadUserFromLocalStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('Loaded user from localStorage:', parsedUser);
      if (parsedUser && parsedUser.id) {
        setUser(parsedUser);
        setIsLoggedIn(true);
      }
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      const userData = response.data.user;

      console.log('User data after login:', userData);

      if (userData && userData.username === 'admin' && password === 'anshelokaz12') {
        toast.success('Admin logged in successfully!');
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.href = '/admin';
      } else if (userData && userData.id) {
        setUser(userData);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userData));
        setShowLoginModal(false);
        toast.success('Logged in successfully!');
      } else {
        toast.error('Invalid login data');
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Invalid credentials');
    }
  };

  const handleRegister = async (username, password) => {
    try {
      await axios.post('http://localhost:3001/register', { username, password });
      toast.success('Registered successfully! Please login.');
      setShowLoginModal(true);
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Error registering');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find(item => item.id === product.id);
      if (existingProduct) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:3001/cart/${productId}`);
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      toast.info('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Error removing from cart');
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const filteredProducts = products.filter(product =>
    (activeCategory === "All" || product.category === activeCategory) &&
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header con animación */}
      <motion.div 
        initial={{ y: -100 }} 
        animate={{ y: 0 }} 
        transition={{ type: 'spring', stiffness: 70 }}>
        <Header 
          isLoggedIn={isLoggedIn}
          user={user}
          cartItemsCount={cart.length}
          onShowCart={() => setShowCart(true)}
          onShowLogin={() => setShowLoginModal(true)}
          onShowRegister={() => setShowRegisterModal(true)}
          onShowProfile={() => {
            if (user) {
              setShowProfile(true);
            } else {
              toast.error('You need to log in to view your profile.');
            }
          }}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </motion.div>

      {/* Contenido principal con animación */}
      <main className="container mx-auto mt-8 px-4">
        <motion.div 
          className="flex flex-col md:flex-row md:space-x-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}>
          <Sidebar 
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <ProductGrid 
            products={filteredProducts}
            onAddToCart={addToCart}
          />
        </motion.div>
      </main>

      {/* Modales */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)} 
        onRegister={handleRegister}
      />
      <CartModal 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cart}
        setCartItems={setCart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
        userId={user?.id} 
      />
      {showProfile && user && (
        <Profile 
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
