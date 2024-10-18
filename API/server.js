const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connection = require('./db'); // Asegúrate de que esta conexión funcione correctamente
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());

// Configuración de Multer para manejar las subidas de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // Guarda los archivos en la carpeta "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Genera un nombre único para cada archivo subido
  }
});

const upload = multer({ storage: storage });

// Servir archivos estáticos desde la carpeta "uploads"
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Utilizar bodyParser.json() para manejar JSON en solicitudes POST
app.use(bodyParser.json());

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    connection.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error registrando usuario:', err);
        return res.status(500).json({ error: 'Error registrando usuario' });
      }
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    });
  } catch (error) {
    console.error('Error procesando el registro:', error);
    res.status(500).json({ error: 'Error procesando el registro' });
  }
});

// Ruta para iniciar sesión (incluyendo admin)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'anshelokaz12') {
    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: 0,
        username: 'admin',
        role: 'admin'
      }
    });
  }

  connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    res.status(200).json({ message: 'Inicio de sesión exitoso', user });
  });
});

// Ruta para obtener todos los productos (para usuarios regulares)
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener todos los productos (para admin)
app.get('/admin/products', (req, res) => {
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener pedidos de clientes (solo para admin)
app.get('/admin/orders', (req, res) => {
  const query = `
    SELECT 
      o.id as order_id, 
      o.total_price, 
      o.payment_method, 
      o.created_at,
      p.id as product_id,
      p.name as product_name,
      oi.quantity,
      oi.price as item_price,
      u.username as customer_name
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo pedidos:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});


// Ruta para agregar un nuevo producto con subida de imagen
app.post('/admin/products', upload.single('image'), (req, res) => {
  const { name, category, price, stock } = req.body;
  let imageUrl = null;

  if (req.file) {
    imageUrl = `uploads/${req.file.filename}`;
  }

  const query = 'INSERT INTO products (name, category, price, stock, image) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [name, category, price, stock, imageUrl], (err, result) => {
    if (err) {
      console.error('Error agregando producto:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Producto agregado exitosamente' });
  });
});

// Ruta para actualizar un producto (incluyendo subida de imagen)
app.put('/admin/products/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock } = req.body;
  let imageUrl = null;

  if (req.file) {
    imageUrl = `uploads/${req.file.filename}`;
  }

  let query = 'UPDATE products SET name = ?, category = ?, price = ?, stock = ?';
  const params = [name, category, price, stock];

  if (imageUrl) {
    query += ', image = ?';
    params.push(imageUrl);
  }

  query += ' WHERE id = ?';
  params.push(id);

  connection.query(query, params, (err, result) => {
    if (err) {
      console.error('Error actualizando producto:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  });
});

// Ruta para eliminar un producto
app.delete('/admin/products/:id', (req, res) => {
  const { id } = req.params;

  // Verifica si el producto está referenciado en order_items o cart
  const checkQuery = `
    SELECT COUNT(*) as count FROM order_items WHERE product_id = ?
    UNION ALL
    SELECT COUNT(*) as count FROM cart WHERE product_id = ?
  `;
  connection.query(checkQuery, [id, id], (err, results) => {
    if (err) {
      console.error('Error verificando referencias del producto:', err);
      return res.status(500).json({ error: err.message });
    }

    const orderItemsCount = results[0].count;
    const cartCount = results[1].count;

    if (orderItemsCount > 0 || cartCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el producto: está referenciado en pedidos o carritos existentes.' });
    }

    const deleteQuery = 'DELETE FROM products WHERE id = ?';
    connection.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Error eliminando producto:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: 'Producto eliminado exitosamente' });
    });
  });
});

// Ruta para subir la foto de perfil
app.post('/upload-profile-picture', upload.single('profile_picture'), (req, res) => {
  const { userId } = req.body;
  const profilePictureUrl = `uploads/${req.file.filename}`;

  const query = 'UPDATE users SET profile_picture = ? WHERE id = ?';
  connection.query(query, [profilePictureUrl, userId], (err, result) => {
    if (err) {
      console.error('Error actualizando foto de perfil:', err);
      return res.status(500).json({ error: 'Error actualizando foto de perfil' });
    }
    res.status(200).json({ message: 'Foto de perfil actualizada exitosamente', profilePictureUrl });
  });
});

// Ruta para obtener el carrito de un usuario
app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT 
      c.id as cart_id, 
      p.id as product_id, 
      p.name as product_name, 
      p.price, 
      p.image, 
      c.quantity 
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error obteniendo el carrito:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para agregar producto al carrito
app.post('/cart', (req, res) => {
  const { productId, quantity, userId } = req.body;
  const query = 'INSERT INTO cart (product_id, quantity, user_id) VALUES (?, ?, ?)';
  connection.query(query, [productId, quantity, userId], (err, result) => {
    if (err) {
      console.error('Error agregando al carrito:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Agregado al carrito' });
  });
});
// Ruta para actualizar el stock de los productos
app.put('/update-stock', (req, res) => {
  const items = req.body.items;

  // Recorre cada producto en el pedido y reduce el stock
  items.forEach(item => {
    const query = 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?';
    connection.query(query, [item.quantity, item.productId, item.quantity], (err, result) => {
      if (err) {
        console.error('Error updating stock:', err);
        return res.status(500).json({ error: 'Error updating stock' });
      }
    });
  });

  res.status(200).json({ message: 'Stock updated successfully' });
});

// Ruta para eliminar producto del carrito
app.delete('/cart/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM cart WHERE id = ?';
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error eliminando del carrito:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Eliminado del carrito' });
  });
});

// Ruta para obtener pedidos de un usuario
app.get('/orders/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      o.id as order_id, 
      o.total_price, 
      o.payment_method, 
      o.created_at,
      p.id as product_id,
      p.name as product_name,
      oi.quantity,
      oi.price as item_price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error obteniendo pedidos:', err);
      return res.status(500).json({ error: 'Error obteniendo pedidos' });
    }

    const orders = results.reduce((acc, row) => {
      if (!acc[row.order_id]) {
        acc[row.order_id] = {
          id: row.order_id,
          total_price: row.total_price,
          payment_method: row.payment_method,
          created_at: row.created_at,
          products: []
        };
      }

      acc[row.order_id].products.push({
        id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        price: row.item_price
      });

      return acc;
    }, {});

    res.status(200).json(Object.values(orders));
  });
});

// Ruta para crear un nuevo pedido
app.post('/orders', (req, res) => {
  const { userId, items, totalPrice, paymentMethod } = req.body;

  if (!userId || !items || items.length === 0 || !totalPrice || !paymentMethod) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const orderQuery = 'INSERT INTO orders (user_id, total_price, payment_method) VALUES (?, ?, ?)';
  connection.query(orderQuery, [userId, totalPrice, paymentMethod], (err, result) => {
    if (err) {
      console.error('Error insertando pedido:', err);
      return res.status(500).json({ error: 'Error insertando pedido', details: err });
    }

    const orderId = result.insertId;
    const orderItemsQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
    const orderItemsData = items.map(item => [orderId, item.productId, item.quantity, item.price]);

    connection.query(orderItemsQuery, [orderItemsData], (err) => {
      if (err) {
        console.error('Error insertando items del pedido:', err);
        return res.status(500).json({ error: 'Error insertando items del pedido', details: err });
      }

      // Eliminar los productos del carrito del usuario
      const deleteCartQuery = 'DELETE FROM cart WHERE user_id = ?';
      connection.query(deleteCartQuery, [userId], (err) => {
        if (err) {
          console.error('Error eliminando carrito después de pedido:', err);
          return res.status(500).json({ error: 'Error eliminando carrito después de pedido', details: err });
        }

        res.status(201).json({ message: 'Pedido creado exitosamente' });
      });
    });
  });
});

// Iniciar el servidor
app.listen(3001, () => {
  console.log('El servidor está corriendo en el puerto 3001');
});
