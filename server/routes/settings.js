import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

function db() { return getDb(); }

router.get('/company', async (req, res) => {
  try {
    const doc = await db().doc('settings/company').get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/company', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await db().doc('settings/company').set(data, { merge: true });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/user/:uid', async (req, res) => {
  try {
    const doc = await db().collection('user-settings').doc(req.params.uid).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/user/:uid', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    await db().collection('user-settings').doc(req.params.uid).set(data, { merge: true });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
