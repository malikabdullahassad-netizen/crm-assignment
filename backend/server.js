const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const contactPersonRoutes = require('./routes/contactPersonRoutes');

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'CRM Lead Manager API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contact-persons', contactPersonRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
