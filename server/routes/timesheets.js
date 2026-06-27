import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const COLLECTION = 'timesheets';

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(COLLECTION);
    if (req.query.employeeId) {
      query = query.where('employeeId', '==', req.query.employeeId);
    }
    const snapshot = await query.orderBy('weekStarting', 'desc').get();
    const timesheets = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(timesheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const data = {
      ...req.body,
      createdAt: ts,
      updatedAt: ts,
    };
    const docRef = await db.collection(COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/submit', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const db = getDb();
    const { approvedBy } = req.body;
    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'Approved',
      approvedBy,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(req.params.id).update({
      status: 'Rejected',
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
