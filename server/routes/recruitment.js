import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const JOBS_COLLECTION = 'job-postings';
const APPLICANTS_COLLECTION = 'applicants';

// -- Jobs --

router.get('/jobs', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(JOBS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    const jobs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const data = {
      ...req.body,
      createdAt: ts,
      updatedAt: ts,
    };
    const docRef = await db.collection(JOBS_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Applicants --

router.get('/applicants', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(APPLICANTS_COLLECTION);
    if (req.query.jobId) {
      query = query.where('jobId', '==', req.query.jobId);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const applicants = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/applicants', async (req, res) => {
  try {
    const db = getDb();
    const ts = new Date().toISOString();
    const data = {
      ...req.body,
      createdAt: ts,
      updatedAt: ts,
    };
    const docRef = await db.collection(APPLICANTS_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
