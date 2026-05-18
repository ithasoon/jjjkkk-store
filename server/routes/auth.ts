import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tajer-super-secret-key-change-me';


// Auth Middleware
export const authenticate = (req: any, res: any, next: any) => {
  // Support Bearer token or token in query param (for backup download)
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/auth/signup', (req, res) => {
  const { shop_name, username, password } = req.body;
  
  if (!shop_name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (shop_name, username, password_hash) VALUES (?, ?, ?)');
    stmt.run(shop_name, username, hash);
    res.json({ success: true, message: 'User created' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username) return res.status(400).json({ error: 'Username or email required' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.password_hash) {
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    } else {
       return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, shop_name: user.shop_name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, shop_name: user.shop_name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/auth/me', authenticate, (req: any, res: any) => {
  res.json({ user: req.user });
});

export default router;
