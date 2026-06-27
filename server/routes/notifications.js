import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { userId, read } = req.query;
    let query = db.collection('notifications').orderBy('createdAt', 'desc');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    let items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (read !== undefined) items = items.filter(i => i.read === (read === 'true'));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('notifications').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ ...doc.data(), id: doc.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, read: false, createdAt: new Date().toISOString() };
    const ref = await db.collection('notifications').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await db.collection('notifications').doc(req.params.id).update(data);
    res.json({ id: req.params.id, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('notifications').doc(req.params.id).delete();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.body;
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ success: true, count: snapshot.size });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/clear-all', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.body;
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ success: true, count: snapshot.size });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notify-managers', async (req, res) => {
  try {
    const db = getDb();
    const { message, type } = req.body;
    const usersSnap = await db.collection('users')
      .where('role', 'in', ['admin', 'hr_manager'])
      .get();
    const notifications = usersSnap.docs.map(u => ({
      userId: u.id,
      message,
      type: type || 'info',
      createdAt: new Date().toISOString(),
      read: false,
    }));
    const batch = db.batch();
    notifications.forEach(n => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, n);
    });
    await batch.commit();
    res.status(201).json({ success: true, count: notifications.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
