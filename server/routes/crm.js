import { Router } from 'express';
import {
  createContact, updateContact, deleteContact, getContact,
  listContacts, getContactStats,
  createDeal, updateDeal, deleteDeal, listDeals, getDealStats,
} from '../services/crm.js';

const router = Router();

// ─── Contacts ───

router.get('/:profileId/contacts', (req, res) => {
  const contacts = listContacts(req.params.profileId, {
    status: req.query.status,
    source: req.query.source,
    search: req.query.search,
  });
  res.json(contacts);
});

router.get('/:profileId/contacts/stats', (req, res) => {
  res.json(getContactStats(req.params.profileId));
});

router.post('/:profileId/contacts', (req, res) => {
  const contact = createContact(req.params.profileId, req.body);
  res.json(contact);
});

router.patch('/contacts/:id', (req, res) => {
  const contact = updateContact(req.params.id, req.body);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

router.delete('/contacts/:id', (req, res) => {
  deleteContact(req.params.id);
  res.json({ success: true });
});

// ─── Deals ───

router.get('/:profileId/deals', (req, res) => {
  res.json(listDeals(req.params.profileId));
});

router.get('/:profileId/deals/stats', (req, res) => {
  res.json(getDealStats(req.params.profileId));
});

router.post('/:profileId/deals', (req, res) => {
  const deal = createDeal(req.params.profileId, req.body);
  res.json(deal);
});

router.patch('/deals/:id', (req, res) => {
  const deal = updateDeal(req.params.id, req.body);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

router.delete('/deals/:id', (req, res) => {
  deleteDeal(req.params.id);
  res.json({ success: true });
});

export { router as crmRoutes };
