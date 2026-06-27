import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const SHIFTS_COLLECTION = 'shifts';
const SWAPS_COLLECTION = 'shift_swaps';

// -- Shifts --

router.get('/shifts', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(SHIFTS_COLLECTION);
    if (req.query.employeeId) {
      query = query.where('employeeId', '==', req.query.employeeId);
    }
    const snapshot = await query.orderBy('date', 'desc').get();
    const shifts = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shifts', async (req, res) => {
  try {
    const db = getDb();
    const data = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection(SHIFTS_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(SHIFTS_COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Swap Requests --

router.get('/swaps', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(SWAPS_COLLECTION);
    if (req.query.employeeId) {
      query = query.where('targetEmployeeId', '==', req.query.employeeId);
    }
    const snapshot = await query.get();
    const swaps = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/swaps', async (req, res) => {
  try {
    const db = getDb();
    const data = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection(SWAPS_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/swaps/:id/approve', async (req, res) => {
  try {
    const db = getDb();
    const { reqShiftId, targetShiftId, reqEmpId, targetEmpId, reqEmpName, targetEmpName } = req.body;
    const now = new Date().toISOString();
    await db.collection(SWAPS_COLLECTION).doc(req.params.id).update({ status: 'Approved', updatedAt: now });
    await db.collection(SHIFTS_COLLECTION).doc(reqShiftId).update({ employeeId: targetEmpId, employeeName: targetEmpName, updatedAt: now });
    await db.collection(SHIFTS_COLLECTION).doc(targetShiftId).update({ employeeId: reqEmpId, employeeName: reqEmpName, updatedAt: now });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/swaps/:id/reject', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(SWAPS_COLLECTION).doc(req.params.id).update({ status: 'Rejected', updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
