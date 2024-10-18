import React, { useState } from 'react';
import { Plus, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGrid({ products = [], onAddToCart = () => {} }) {
  const SERVER_URL = 'http://localhost:3001'; // Asegúrate de que este es el puerto correcto donde corre tu servidor

  return (
    <div className="flex-1">
      <h2 className="text-3xl font-bold mb-6">Explore</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onAddToCart={onAddToCart} serverUrl={SERVER_URL} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProductCard({ product, index, onAddToCart, serverUrl }) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Manejar el clic en la imagen para expandir o cerrar
  const handleImageClick = () => {
    if (!isImageExpanded) {
      // Crear un nuevo objeto de imagen para calcular sus dimensiones reales
      const img = new Image();
      img.src = `${serverUrl}/${product.image}`;
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setIsImageExpanded(true);
      };
    } else {
      setIsImageExpanded(false);
    }
  };

  return (
    <>
      <motion.div
        className="bg-white rounded-lg shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{
          duration: 0.5,
          delay: index * 0.1,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="relative w-full h-48">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
          >
            <img
              src={product.image ? `${serverUrl}/${product.image}` : '/placeholder.svg'}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={handleImageClick} // Al hacer clic, expande la imagen
            />
          </motion.div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
          <p className="text-lg font-bold mt-2">
            ${Number.isFinite(Number(product.price)) ? Number(product.price).toFixed(2) : '0.00'}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <motion.button
              onClick={() => onAddToCart(product)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} className="mr-2" />
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                Add to Cart
              </motion.span>
            </motion.button>
            <motion.button
              className="text-gray-400 hover:text-red-500 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart size={20} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Modal para la imagen expandida */}
      <AnimatePresence>
        {isImageExpanded && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={`${serverUrl}/${product.image}`}
                alt={product.name}
                className="object-contain cursor-pointer"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  width: `${Math.min(imageDimensions.width, window.innerWidth * 0.9)}px`,
                  height: `${Math.min(imageDimensions.height, window.innerHeight * 0.9)}px`,
                }}
                onClick={handleImageClick} // Cierra la imagen al hacer clic
              />
              <button
                onClick={handleImageClick}
                className="absolute top-4 right-4 text-white hover:text-gray-400"
              >
                <X size={32} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
