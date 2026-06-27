import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const COLLECTION = 'reminders';

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(COLLECTION);
    if (req.query.userId) {
      query = query.where('userId', '==', req.query.userId);
    }
    const snapshot = await query.orderBy('reminderTime', 'asc').get();
    const reminders = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const ts = new Date().toISOString();
    const data = {
      ...req.body,
      createdAt: ts,
      updatedAt: ts,
    };
    const db = getDb();
    const docRef = await db.collection(COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.body;
    const snapshot = await db.collection(COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clear-all', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.body;
    const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).get();
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
