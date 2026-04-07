import { randomBytes, createHash } from 'crypto';
import { dbGet, dbSet, dbList, dbDelete } from './db.js';

function hashPassword(password, salt) {
  return createHash('sha256').update(password + salt).digest('hex');
}

export function createUser(email, password, name) {
  const existing = dbList('users', (u) => u.email === email);
  if (existing.length > 0) throw new Error('Email already registered');

  const id = randomBytes(16).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = hashPassword(password, salt);

  const user = {
    id,
    email,
    name,
    salt,
    password: hashedPassword,
    createdAt: Date.now(),
  };

  dbSet('users', id, user);
  return { id, email, name };
}

export function loginUser(email, password) {
  const users = dbList('users', (u) => u.email === email);
  if (users.length === 0) throw new Error('Invalid email or password');

  const user = users[0];
  const hashed = hashPassword(password, user.salt);
  if (hashed !== user.password) throw new Error('Invalid email or password');

  // Generate session token
  const token = randomBytes(32).toString('hex');
  dbSet('sessions', token, { userId: user.id, createdAt: Date.now() });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export function validateToken(token) {
  if (!token) return null;
  const session = dbGet('sessions', token);
  if (!session) return null;
  const user = dbGet('users', session.userId);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export function logoutUser(token) {
  dbDelete('sessions', token);
}
