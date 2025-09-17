require('dotenv').config();
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Local frontend for development
];

// For production, add the deployed frontend URL from an environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Auth routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Admin/User/Blog/Upload routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);
const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);

// MongoDB connection (use env)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  // Auto-create admin user if not exists
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '12345678';
  const admin = await User.findOne({ username: adminEmail });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminEmail, password: hashedPassword, role: 'admin' });
    console.log('Default admin user created: admin@gmail.com / 12345678');
  }
});

// Placeholder route
app.get('/', (req, res) => {
  res.send('MERN Blog Backend Running');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});