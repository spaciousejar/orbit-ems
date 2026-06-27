import { Router } from 'express';
import { getDb } from '../firebase.js';
import { verifyAuth } from '../auth.js';

const router = Router();
router.use(verifyAuth);

router.post('/send-leave-status', async (req, res) => {
  try {
    const db = getDb();
    const { to, subject, text, html } = req.body;
    const mailDoc = {
      to,
      message: { subject, text, html },
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection('mail').add(mailDoc);
    res.status(201).json({ id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
