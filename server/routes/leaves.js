import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { employeeId, status } = req.query;
    let query = db.collection('leaves').orderBy('createdAt', 'desc');
    if (employeeId) query = query.where('employeeId', '==', employeeId);
    const snap = await query.get();
    let items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (status) items = items.filter(i => i.status === status);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('leaves').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ ...doc.data(), id: doc.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const data = { ...req.body, createdAt: ts, updatedAt: ts };
    const ref = await db.collection('leaves').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await db.collection('leaves').doc(req.params.id).update(data);
    res.json({ id: req.params.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('leaves').doc(req.params.id).delete();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
