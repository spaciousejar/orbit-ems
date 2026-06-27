import { getAuth } from 'firebase-admin/auth';
import { initFirebase, getDb } from './firebase.js';

export async function verifyAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function verifyAdmin(req, res, next) {
  await verifyAuth(req, res, async () => {
    try {
      const db = getDb();
      const snap = await db.collection('users').where('uid', '==', req.user.uid).limit(1).get();
      if (snap.empty) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const employee = snap.docs[0].data();
      if (employee.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
