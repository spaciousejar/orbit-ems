import { Router } from 'express';
import { verifyAuth } from '../auth.js';
import { getDb } from '../firebase.js';

const router = Router();
router.use(verifyAuth);

const COURSES_COLLECTION = 'courses';
const NOMINATIONS_COLLECTION = 'course_nominations';

// -- Courses --

router.get('/courses', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COURSES_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    const courses = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const db = getDb();
    const data = { ...req.body, createdAt: new Date().toISOString() };
    const docRef = await db.collection(COURSES_COLLECTION).add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Nominations --

router.get('/nominations', async (req, res) => {
  try {
    const db = getDb();
    let query = db.collection(NOMINATIONS_COLLECTION);
    if (req.query.employeeId) {
      query = query.where('employeeId', '==', req.query.employeeId);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const nominations = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(nominations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/nominations', async (req, res) => {
  try {
    const db = getDb();
    const docRef = await db.collection(NOMINATIONS_COLLECTION).add(req.body);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/nominations/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection(NOMINATIONS_COLLECTION).doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
