const { Router } = require('express');
const { z } = require('zod');
const pool = require('../db');
const authenticate = require('../middleware/auth');

const router = Router();
const leadInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  courseInterest: z.string().trim().min(1).max(160),
  message: z.string().trim().max(5000).optional().nullable()
});
const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// Public prospective-client form; intentionally does not require a token.
router.post('/', async (req, res, next) => {
  const parsed = leadInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors });
  const { name, email, phone, courseInterest, message } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, course_interest, message)
       VALUES ($1, LOWER($2), $3, $4, $5)
       RETURNING id, name, email, phone, course_interest AS "courseInterest", message, created_at AS "createdAt"`,
      [name, email, phone || null, courseInterest, message || null]
    );
    return res.status(201).json({ lead: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.use(authenticate);

router.get('/public', async (req, res, next) => {
  const parsed = pagination.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten().fieldErrors });
  const { limit, offset } = parsed.data;
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, course_interest AS "courseInterest", message,
              created_at AS "createdAt"
       FROM leads WHERE claimed_by IS NULL
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]
    );
    return res.json({ leads: result.rows, pagination: { limit, offset } });
  } catch (error) {
    return next(error);
  }
});

router.get('/mine', async (req, res, next) => {
  const parsed = pagination.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten().fieldErrors });
  const { limit, offset } = parsed.data;
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, course_interest AS "courseInterest", message,
              claimed_by AS "claimedBy", claimed_at AS "claimedAt", created_at AS "createdAt"
       FROM leads WHERE claimed_by = $1
       ORDER BY claimed_at DESC LIMIT $2 OFFSET $3`, [req.employee.id, limit, offset]
    );
    return res.json({ leads: result.rows, pagination: { limit, offset } });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/claim', async (req, res, next) => {
  const id = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'Lead id must be a positive integer' });
  try {
    // The WHERE condition makes this an atomic claim: only one counselor can win.
    const result = await pool.query(
      `UPDATE leads SET claimed_by = $1, claimed_at = NOW()
       WHERE id = $2 AND claimed_by IS NULL
       RETURNING id, name, email, phone, course_interest AS "courseInterest", message,
                 claimed_by AS "claimedBy", claimed_at AS "claimedAt", created_at AS "createdAt"`,
      [req.employee.id, id.data]
    );
    if (result.rowCount) return res.json({ lead: result.rows[0] });
    const exists = await pool.query('SELECT claimed_by FROM leads WHERE id = $1', [id.data]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Lead not found' });
    if (String(exists.rows[0].claimed_by) === String(req.employee.id)) {
      return res.status(409).json({ error: 'You have already claimed this lead' });
    }
    return res.status(409).json({ error: 'This lead has already been claimed' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
