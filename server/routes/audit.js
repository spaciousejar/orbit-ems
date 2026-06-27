import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();
router.use(verifyAuth);

const COLLECTION = 'audit_logs';

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    const logs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audit
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const docRef = await db.collection(COLLECTION).add({
      ...req.body,
      timestamp: new Date().toISOString(),
    });
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
