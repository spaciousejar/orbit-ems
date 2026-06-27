import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { departmentId, status, email } = req.query;
    let query = db.collection('users');
    if (departmentId) query = query.where('department', '==', departmentId);
    if (status) query = query.where('status', '==', status);
    if (email) query = query.where('email', '==', email);
    const snap = await query.get();
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ ...doc.data(), id: doc.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const { id, ...body } = req.body;
    const data = { ...body, createdAt: ts, updatedAt: ts };
    let ref;
    if (id) {
      ref = db.collection('users').doc(id);
      await ref.set(data);
    } else {
      ref = await db.collection('users').add(data);
    }
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id, ...body } = req.body;
    const data = { ...body, updatedAt: new Date().toISOString() };
    await db.collection('users').doc(req.params.id).update(data);
    res.json({ id: req.params.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('users').doc(req.params.id).delete();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
