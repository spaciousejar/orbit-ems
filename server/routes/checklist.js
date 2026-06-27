import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const ONBOARDING_COLLECTION = 'onboarding';
const OFFBOARDING_COLLECTION = 'offboarding';

// -- Onboarding --

router.get('/onboarding', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(ONBOARDING_COLLECTION).get();
    const processes = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(processes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/onboarding', async (req, res) => {
  try {
    const db = getDb();
    const data = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection(ONBOARDING_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/onboarding/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(ONBOARDING_COLLECTION).doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/onboarding/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(ONBOARDING_COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Offboarding --

router.get('/offboarding', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(OFFBOARDING_COLLECTION).get();
    const processes = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(processes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/offboarding', async (req, res) => {
  try {
    const db = getDb();
    const data = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection(OFFBOARDING_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/offboarding/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(OFFBOARDING_COLLECTION).doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/offboarding/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(OFFBOARDING_COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
