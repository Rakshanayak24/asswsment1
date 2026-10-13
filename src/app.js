const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { clientOrigin } = require('./config');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: clientOrigin === '*' ? true : clientOrigin }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
