import React, { useState } from 'react';
import { Search, ShoppingBag, User, Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header({ isLoggedIn, user, cartItemsCount, onShowCart, onShowLogin, onShowRegister, onLogout, searchTerm, onSearchChange }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // Para manejar el menú del avatar

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600 mr-6 flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2" />
            <span className="hidden sm:inline-block">BuyMore</span>
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <Link className="text-gray-600 hover:text-gray-900" to="/explore">Explore</Link>
            <Link className="text-gray-900" to="/feed">Feed</Link>
            <Link className="text-gray-600 hover:text-gray-900" to="/discover">Discover</Link>
          </nav>
        </div>
        <button className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="search"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-64 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <Bell className="h-6 w-6" />
          </button>
          <button className="text-gray-600 hover:text-gray-900 relative" onClick={onShowCart}>
            <ShoppingBag className="h-6 w-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {cartItemsCount}
              </span>
            )}
          </button>
          {isLoggedIn ? (
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {/* Si el usuario tiene una foto de perfil, la mostramos, si no, mostramos la imagen por defecto */}
                <img 
                  src={user.profile_picture ? `http://localhost:3001/${user.profile_picture}` : '/placeholder.svg'}
                  alt={user.username} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{user.username}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-6 w-6" />
                <span>Account</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                  <button onClick={onShowLogin} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Login
                  </button>
                  <button onClick={onShowRegister} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Register
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showMobileMenu && (
        <div className="md:hidden bg-white py-2">
          <nav className="flex flex-col space-y-2 px-4">
            <Link className="text-gray-600 hover:text-gray-900 py-2" to="/explore">Explore</Link>
            <Link className="text-gray-900 py-2" to="/feed">Feed</Link>
            <Link className="text-gray-600 hover:text-gray-900 py-2" to="/discover">Discover</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
