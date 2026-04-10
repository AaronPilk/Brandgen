// Built-in CRM — contacts, deals, and notes per profile
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbList, dbDelete } from './db.js';

// ─── Contacts ───

export function createContact(profileId, data) {
  const id = uuidv4();
  const contact = {
    id,
    profileId,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    company: data.company || '',
    source: data.source || 'manual', // manual, landing-page, meta-ads, import
    status: data.status || 'new', // new, contacted, qualified, proposal, won, lost
    tags: data.tags || [],
    notes: data.notes || '',
    value: data.value || 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dbSet('contacts', id, contact);
  return contact;
}

export function updateContact(id, data) {
  const contact = dbGet('contacts', id);
  if (!contact) return null;
  const updated = { ...contact, ...data, updatedAt: Date.now() };
  dbSet('contacts', id, updated);
  return updated;
}

export function deleteContact(id) {
  dbDelete('contacts', id);
}

export function getContact(id) {
  return dbGet('contacts', id);
}

export function listContacts(profileId, filters = {}) {
  let contacts = dbList('contacts', (c) => c.profileId === profileId);
  if (filters.status) contacts = contacts.filter((c) => c.status === filters.status);
  if (filters.source) contacts = contacts.filter((c) => c.source === filters.source);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    contacts = contacts.filter((c) =>
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  }
  return contacts.sort((a, b) => b.createdAt - a.createdAt);
}

export function getContactStats(profileId) {
  const contacts = dbList('contacts', (c) => c.profileId === profileId);
  const stats = {
    total: contacts.length,
    new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0,
    totalValue: 0,
  };
  contacts.forEach((c) => {
    if (stats[c.status] !== undefined) stats[c.status]++;
    stats.totalValue += c.value || 0;
  });
  return stats;
}

// ─── Deals ───

export function createDeal(profileId, data) {
  const id = uuidv4();
  const deal = {
    id,
    profileId,
    contactId: data.contactId || null,
    title: data.title || '',
    value: data.value || 0,
    stage: data.stage || 'lead', // lead, qualified, proposal, negotiation, won, lost
    notes: data.notes || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dbSet('deals', id, deal);
  return deal;
}

export function updateDeal(id, data) {
  const deal = dbGet('deals', id);
  if (!deal) return null;
  const updated = { ...deal, ...data, updatedAt: Date.now() };
  dbSet('deals', id, updated);
  return updated;
}

export function deleteDeal(id) {
  dbDelete('deals', id);
}

export function listDeals(profileId) {
  return dbList('deals', (d) => d.profileId === profileId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getDealStats(profileId) {
  const deals = dbList('deals', (d) => d.profileId === profileId);
  const stats = {
    total: deals.length,
    lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0,
    totalValue: 0, wonValue: 0,
  };
  deals.forEach((d) => {
    if (stats[d.stage] !== undefined) stats[d.stage]++;
    stats.totalValue += d.value || 0;
    if (d.stage === 'won') stats.wonValue += d.value || 0;
  });
  return stats;
}
