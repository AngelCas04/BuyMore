import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Plus, Minus } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartModal({ isOpen, onClose, cartItems, setCartItems, onRemoveItem, onUpdateQuantity, userId }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });

  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'; // URL del servidor
  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handlePayment = async (method) => {
    if (method === 'Credit Card' && !showCardForm) {
      setShowCardForm(true);
      return;
    }

    if (method === 'Credit Card') {
      if (cardDetails.number && cardDetails.expiry && cardDetails.cvv) {
        processPayment(method);
      } else {
        setPaymentMessage('Please enter all card details.');
      }
    } else {
      processPayment(method);
    }
  };

  const processPayment = async (method) => {
    setIsProcessing(true);
    setPaymentMessage(`Processing payment with ${method}...`);
    try {
      await registerOrder(userId, cartItems, total, method);
      setPaymentMessage(`Payment successful with ${method}!`);
      setShowCardForm(false);
      setCardDetails({ number: '', expiry: '', cvv: '' });
      setCartItems([]); // Vaciar el carrito después del pago
      onClose(); // Cerrar el carrito después del pago
    } catch (error) {
      setPaymentMessage(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const registerOrder = async (userId, cartItems, total, paymentMethod) => {
    try {
      const orderData = {
        userId,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        totalPrice: parseFloat(total.toFixed(2)),
        paymentMethod,
      };

      console.log('Registering order with data:', orderData);

      // Llamada para registrar el pedido
      const response = await axios.post('http://localhost:3001/orders', orderData);

      // Llamada para reducir el stock después de un pedido exitoso
      await axios.put('http://localhost:3001/update-stock', { items: cartItems });

      console.log('Order registration and stock update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error registering order:', error.response?.data || error.message);
      throw new Error('Error registering your order. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-semibold">Your Cart</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-500">Your cart is empty</p>
              ) : (
                cartItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      {/* Mostrar la imagen del producto */}
                      <img
                        src={`${SERVER_URL}/${item.image}`} // Asegúrate de construir la URL completa de la imagen
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded mr-4"
                      />
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${Number.isFinite(Number(item.price)) ? Number(item.price).toFixed(2) : '0.00'} x{' '}
                          {item.quantity}
                        </p>
                        <div className="flex mt-2 space-x-2 items-center">
                          {/* Botón para reducir cantidad */}
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            disabled={item.quantity === 1} // No permitir bajar de 1
                          >
                            <Minus size={16} />
                          </button>
                          <span>{item.quantity}</span>
                          {/* Botón para aumentar cantidad, validando el stock */}
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            disabled={item.quantity >= item.stock} // Deshabilitar si el stock es igual o menor que la cantidad actual
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {/* Mostrar mensaje si no hay suficiente stock */}
                        {item.quantity >= item.stock && <p className="text-red-500 text-xs">No more stock available</p>}
                      </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                      <X size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${total.toFixed(2)}</span>
                </div>

                {/* Botones de pago */}
                {!showCardForm ? (
                  <div className="flex justify-between gap-4 mb-4">
                    <button
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      onClick={() => handlePayment('Credit Card')}
                      disabled={isProcessing}
                    >
                      <CreditCard size={20} className="mr-2" />
                      Pay with Credit Card
                    </button>
                    <button
                      className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center"
                      onClick={() => handlePayment('PayPal')}
                      disabled={isProcessing}
                    >
                      <DollarSign size={20} className="mr-2" />
                      Pay with PayPal
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Enter Card Details</h3>
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full mb-2 p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Expiry Date (MM/YY)"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="w-full mb-2 p-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full mb-4 p-2 border rounded"
                    />
                    <button
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      onClick={() => handlePayment('Credit Card')}
                      disabled={isProcessing}
                    >
                      Confirm Payment
                    </button>
                  </div>
                )}

                {/* Mensaje de confirmación */}
                {paymentMessage && (
                  <p className={`text-center ${isProcessing ? 'text-gray-500' : 'text-green-500'} font-semibold`}>
                    {paymentMessage}
                  </p>
                )}

                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 mt-4"
                  disabled={isProcessing}
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
