import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

function db() { return getDb(); }

/* ── Salary Structures ── */
router.get('/salary-structures/:employeeId', async (req, res) => {
  try {
    const snap = await db().collection('salary_structures')
      .where('employeeId', '==', req.params.employeeId).get();
    if (snap.empty) return res.json(null);
    const d = snap.docs[0];
    res.json({ ...d.data(), id: d.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/salary-structures', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (id) {
      await db().collection('salary_structures').doc(id).update({ ...data, updatedAt: new Date().toISOString() });
      res.json({ id, ...data });
    } else {
      const ref = await db().collection('salary_structures').add({ ...data, updatedAt: new Date().toISOString() });
      res.status(201).json({ id: ref.id, ...data });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Payroll Runs ── */
router.get('/payroll-runs', async (req, res) => {
  try {
    const snap = await db().collection('payroll_runs').orderBy('period', 'desc').get();
    res.json(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payroll-runs', async (req, res) => {
  try {
    const ref = await db().collection('payroll_runs').add({ ...req.body, createdAt: new Date().toISOString() });
    res.status(201).json({ id: ref.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/payroll-runs/:id', async (req, res) => {
  try {
    await db().collection('payroll_runs').doc(req.params.id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Salary Slips ── */
router.get('/salary-slips', async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = db().collection('salary_slips');
    if (employeeId) query = query.where('employeeId', '==', employeeId);
    const snap = await query.get();
    res.json(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/salary-slips/batch', async (req, res) => {
  try {
    const slips = req.body.slips;
    if (!Array.isArray(slips)) return res.status(400).json({ error: 'Expected an array' });
    const ids = [];
    for (const slip of slips) {
      const ref = await db().collection('salary_slips').add(slip);
      ids.push(ref.id);
    }
    res.status(201).json({ ids });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/salary-slips/:id/pay', async (req, res) => {
  try {
    await db().collection('salary_slips').doc(req.params.id).update({
      status: 'Paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.json({ id: req.params.id, status: 'Paid' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
