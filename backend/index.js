require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",                // Local dev
  "https://website-nine-eta-78.vercel.app" // Vercel frontend
];

// Add FRONTEND_URL from .env if exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  // Auto-create admin user if not exists
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '12345678';
  const admin = await User.findOne({ username: adminEmail });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminEmail, password: hashedPassword, role: 'admin' });
    console.log('✅ Default admin user created');
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('MERN Blog Backend Running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
