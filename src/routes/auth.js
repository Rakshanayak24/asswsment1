const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../db');
const { jwtSecret, jwtExpiresIn } = require('../config');

const router = Router();
const credentials = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72)
});
const loginCredentials = credentials.pick({ email: true, password: true });

function issueToken(employee) {
  return jwt.sign({ email: employee.email }, jwtSecret, {
    subject: String(employee.id), expiresIn: jwtExpiresIn, algorithm: 'HS256'
  });
}

router.post('/register', async (req, res, next) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  const { name, email, password } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO employees (name, email, password_hash) VALUES ($1, LOWER($2), $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    const employee = result.rows[0];
    return res.status(201).json({ employee, token: issueToken(employee) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const parsed = loginCredentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  const { email, password } = parsed.data;
  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM employees WHERE email = LOWER($1)', [email]
    );
    const employee = result.rows[0];
    if (!employee || !(await bcrypt.compare(password, employee.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    delete employee.password_hash;
    return res.json({ employee, token: issueToken(employee) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
