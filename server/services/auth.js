import { randomBytes, createHash } from 'crypto';
import { dbGet, dbSet, dbList, dbDelete } from './db.js';

function hashPassword(password, salt) {
  return createHash('sha256').update(password + salt).digest('hex');
}

export function createUser(email, password, name, role = null) {
  const existing = dbList('users', (u) => u.email === email);
  if (existing.length > 0) throw new Error('Email already registered');

  // First user ever created is always admin
  const allUsers = dbList('users');
  const isFirstUser = allUsers.length === 0;

  const id = randomBytes(16).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = hashPassword(password, salt);

  const user = {
    id,
    email,
    name,
    salt,
    password: hashedPassword,
    role: isFirstUser ? 'admin' : (role || 'employee'),
    createdAt: Date.now(),
  };

  dbSet('users', id, user);
  return { id, email, name, role: user.role };
}

export function loginUser(email, password) {
  const users = dbList('users', (u) => u.email === email);
  if (users.length === 0) throw new Error('Invalid email or password');

  const user = users[0];
  const hashed = hashPassword(password, user.salt);
  if (hashed !== user.password) throw new Error('Invalid email or password');

  // Backfill role for pre-existing users
  if (!user.role) {
    const allUsers = dbList('users');
    user.role = allUsers.length <= 1 ? 'admin' : 'employee';
    dbSet('users', user.id, user);
  }

  // Generate session token
  const token = randomBytes(32).toString('hex');
  dbSet('sessions', token, { userId: user.id, createdAt: Date.now() });

  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export function validateToken(token) {
  if (!token) return null;
  const session = dbGet('sessions', token);
  if (!session) return null;
  const user = dbGet('users', session.userId);
  if (!user) return null;

  // Backfill role for users created before role system was added
  // First user in the system defaults to admin
  if (!user.role) {
    const allUsers = dbList('users');
    const isFirstUser = allUsers.length <= 1 || allUsers[0]?.id === user.id;
    user.role = isFirstUser ? 'admin' : 'employee';
    dbSet('users', user.id, user); // persist the fix
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function logoutUser(token) {
  dbDelete('sessions', token);
}

export function updateUser(userId, { name, email, password }) {
  const user = dbGet('users', userId);
  if (!user) throw new Error('User not found');

  if (name !== undefined) user.name = name;

  if (email !== undefined && email !== user.email) {
    // Check email uniqueness
    const existing = dbList('users', (u) => u.email === email && u.id !== userId);
    if (existing.length > 0) throw new Error('Email already in use');
    user.email = email;
  }

  if (password) {
    const salt = randomBytes(16).toString('hex');
    user.salt = salt;
    user.password = hashPassword(password, salt);
  }

  dbSet('users', userId, user);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function listUsers() {
  return dbList('users').map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

export function updateUserRole(userId, role) {
  const user = dbGet('users', userId);
  if (!user) throw new Error('User not found');
  user.role = role;
  dbSet('users', userId, user);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function deleteUser(userId) {
  dbDelete('users', userId);
}
