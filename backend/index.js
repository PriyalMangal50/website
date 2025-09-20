require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",                // Local dev
  "https://website-front.netlify.app"     // Netlify frontend
];

// Add FRONTEND_URL from .env if exists
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin) || /\.netlify\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/user', require('./routes/user'));
app.use('/api/blog', require('./routes/blog'));

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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin1234@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Priyal1234567890';
  const admin = await User.findOne({ username: adminEmail });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminEmail, password: hashedPassword, role: 'admin' });
    console.log('✅ Default admin user created');
  }
});

// Health check
app.get('/', (req, res) => res.send('MERN Blog Backend Running'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
