import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Calendar, CreditCard } from 'lucide-react';
import Header from './ui/Header';

export default function Profile({ onClose }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser && parsedUser.id) {
        fetchOrders(parsedUser.id);
        if (parsedUser.profile_picture) {
          setProfilePicturePreview(`http://localhost:3001/${parsedUser.profile_picture}`); // Cargar la foto de perfil actual
        }
      } else {
        showLoginAlert();
      }
    } else {
      showLoginAlert();
    }
  }, []);

  const showLoginAlert = () => {
    alert('You need to log in or register to view your profile.');
    navigate('/');
    setLoading(false);
  };

  const fetchOrders = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/orders/${userId}`);
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again later.');
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setProfilePicturePreview(URL.createObjectURL(file)); // Mostrar vista previa de la imagen
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicturePreview) return;

    const formData = new FormData();
    formData.append('profile_picture', document.querySelector('#profilePictureInput').files[0]);
    formData.append('userId', user.id);

    try {
      const response = await axios.post('http://localhost:3001/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePicturePreview(`http://localhost:3001/${response.data.profilePictureUrl}`);
      alert('Profile picture updated successfully');
      // Actualiza el usuario en localStorage con la nueva foto
      const updatedUser = { ...user, profile_picture: response.data.profilePictureUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  if (!user || !user.id) {
    return null; // No muestra nada ya que el alert y la redirección se encargan
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        isLoggedIn={!!user}
        user={user}
        cartItemsCount={0}
        onShowCart={() => {}}
        onShowLogin={() => {}}
        onShowRegister={() => {}}
        onLogout={() => {
          localStorage.removeItem('user');
          window.location.reload();
        }}
        searchTerm=""
        onSearchChange={() => {}}
      />

      <main className="container mx-auto mt-8 px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Your Profile</h2>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Account Information</h3>
              <p><strong>Username:</strong> {user.username}</p>
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Profile Picture</h4>
                <div className="flex items-center space-x-4">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <img src={`http://localhost:3001/${user.profile_picture}`} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  )}
                  <input type="file" id="profilePictureInput" onChange={handleProfilePictureChange} />
                  <button
                    onClick={handleProfilePictureUpload}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Upload Picture
                  </button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Order History</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500">You haven't made any purchases yet.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-gray-100 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Order #{order.id}</h4>
                      <span className="text-sm text-gray-500">
                        <Calendar className="inline mr-1" size={16} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <CreditCard className="inline mr-1" size={16} />
                        Payment Method: {order.payment_method}
                      </p>
                      <p className="font-semibold">
                        Total: ${Number(order.total_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <h5 className="font-semibold mb-2">Items:</h5>
                      {order.products.map((product) => (
                        <div key={product.product_id} className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <ShoppingBag className="mr-2" size={16} />
                            <span>{product.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {product.quantity} x ${Number(product.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
