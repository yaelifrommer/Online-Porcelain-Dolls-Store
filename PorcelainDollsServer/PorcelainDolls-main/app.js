const express = require('express'); // For server.
const jwt = require('jsonwebtoken'); // For verifying the tokens.
const mongoose = require('mongoose'); // For DB.
const bcrypt = require('bcryptjs'); // For passwords.
const cors = require('cors'); // For clients requests.
const multer = require('multer'); // Saving images by server.
const path = require('path'); // Dealing with files and paths.

const app = express();
const port = 5000;
const secretKey = 's3cR3tK3y$1q2w#eRtY%uI9oLpQx!ZaSdF5gHjK7'; // Secret key for JWT

// Middleware setup
app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images'))); // Getting images from servers images folder.

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/shopDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: Boolean
});
const User = mongoose.model('User', userSchema);

// Product schema and model
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String
});
const Product = mongoose.model('Product', productSchema);

// Order schema and model
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  userName: String, // Name of the user
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to Product model
    quantity: Number // Quantity of the product
  }],
  total: Number,
  status: { 
    type: String, 
    default: 'Open Order', 
    enum: ['Open Order', 'Ordered'] 
  },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Multer configuration for file uploads.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images'); // Where to keep the images in the server.
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // What name to call the images.
  }
});
const upload = multer({ storage: storage });

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: 'Registration failed, username already exists' });
  }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if the user should be an admin
  const isAdmin = (username === 'Yaeli Frommer' && password === '123456789');

  const newUser = new User({ username, password: hashedPassword, isAdmin });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) { // User was not found or password isn't equal.
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate a token(Will be expired after  an hour.)
  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, secretKey, { expiresIn: '1h' });

  // Find an open order for the user
  const openOrder = await Order.findOne({ user: user._id, status: 'Open Order' }).populate('items.product'); // Full product details according to ID.

  res.json({ token, isAdmin: user.isAdmin, openOrder });
});

// Middleware to authenticate token and add the users details for the continious functions.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token not found' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Get all products
app.get('/products', authenticateToken, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Add a new product
app.post('/products', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' }); // Adding product without being an admin.
  const { name, description, price } = req.body;
  const imageUrl = req.file ? `http://localhost:5000/images/${req.file.filename}` : ''; // The name Multer made up.
  const newProduct = new Product({ name, description, price, imageUrl });
  try {
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', imageUrl: imageUrl });
  } catch (error) {
    res.status(400).json({ error: 'Error adding product' });
  }
});

// Update a product
app.put('/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
  const { name, description, price } = req.body;
  const updates = { name, description, price };
  if (req.file) {
    updates.imageUrl = `http://localhost:5000/images/${req.file.filename}`; // The new image.
  }
  try {
    await Product.findByIdAndUpdate(req.params.id, updates); // Find product to update.
    res.json({ message: 'Product updated successfully', imageUrl: updates.imageUrl });
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' });
  }
});

// Delete a product
app.delete('/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting product' });
  }
});

// Save cart
app.post('/save-cart', authenticateToken, async (req, res) => {
  const { cart, status } = req.body;
  const userId = req.user.id;

  try {
    await Order.findOneAndDelete({ user: userId, status: 'Open Order' }); // Erase the open order from before - empty the place for the new open order.

    const user = await User.findById(userId); // Find the current user.
    const newOrder = new Order({ // A new ordr/
      user: userId,
      userName: user.username,
      items: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      total: cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0),
      status
    });

    await newOrder.save();
    res.status(200).json({ message: 'Cart saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

// Complete order
app.post('/complete-order', authenticateToken, async (req, res) => {
  const { cart, status } = req.body;
  const userId = req.user.id;

  try {
    await Order.findOneAndDelete({ user: userId, status: 'Open Order' }); // Erase the open order.

    const user = await User.findById(userId); // Find user.
    const newOrder = new Order({
      user: userId,
      userName: user.username,
      items: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      total: cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0),
      status: 'Ordered'
    });

    await newOrder.save();
    res.status(200).json({ message: 'Order completed and saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete and save order' });
  }
});

// Get user orders
app.get('/user-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id, status: 'Ordered' }).populate('items.product'); // Bring the full detailed product for the givven id.
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user orders' });
  }
});

// Get admin orders
app.get('/admin-orders', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
  try {
    const orders = await Order.find({ status: 'Ordered' }).populate('items.product').populate('user', 'username'); // Orders of all costumers.
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Delete all orders
app.delete('/delete-orders', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
  try {
    await Order.deleteMany({ status: 'Ordered' });
    res.status(200).json({ message: 'All orders with status "Ordered" have been deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting orders' });
  }
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
