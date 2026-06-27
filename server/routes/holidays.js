import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { year } = req.query;
    let query = db.collection('holidays').orderBy('date', 'asc');
    const snap = await query.get();
    let items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (year) items = items.filter(i => i.date?.startsWith(year));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const data = { ...req.body, createdAt: ts, updatedAt: ts };
    const ref = await db.collection('holidays').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await db.collection('holidays').doc(req.params.id).update(data);
    res.json({ id: req.params.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('holidays').doc(req.params.id).delete();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
