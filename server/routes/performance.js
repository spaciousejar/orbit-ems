import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

function db() { return getDb(); }

/* ── Goals ── */
router.get('/goals', async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = db().collection('goals').orderBy('createdAt', 'desc');
    if (employeeId) query = query.where('employeeId', '==', employeeId);
    const snap = await query.get();
    res.json(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/goals', async (req, res) => {
  try {
    const ref = await db().collection('goals').add({ ...req.body, createdAt: new Date().toISOString() });
    res.status(201).json({ id: ref.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/goals/:id', async (req, res) => {
  try {
    await db().collection('goals').doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    await db().collection('goals').doc(req.params.id).delete();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Appraisals ── */
router.get('/appraisals', async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = db().collection('appraisals');
    if (employeeId) query = query.where('employeeId', '==', employeeId);
    const snap = await query.get();
    res.json(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/appraisals', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const docData = { ...data, updatedAt: new Date().toISOString() };
    if (id) {
      await db().collection('appraisals').doc(id).update(docData);
      res.json({ id, ...docData });
    } else {
      const ref = await db().collection('appraisals').add(docData);
      res.status(201).json({ id: ref.id, ...docData });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
