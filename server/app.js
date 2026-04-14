const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/jobbers', require('./routes/jobberRoutes'));
app.use('/api/transporters', require('./routes/transporterRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/purchase', require('./routes/purchaseRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    status,
    message
  });
});

module.exports = app;
