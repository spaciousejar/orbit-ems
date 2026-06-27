import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import { GoogleGenAI } from '@google/genai';

import { initFirebase } from './firebase.js';
import usersRouter from './routes/users.js';
import attendanceRouter from './routes/attendance.js';
import leavesRouter from './routes/leaves.js';
import holidaysRouter from './routes/holidays.js';
import tasksRouter from './routes/tasks.js';
import departmentsRouter from './routes/departments.js';
import announcementsRouter from './routes/announcements.js';
import notificationsRouter from './routes/notifications.js';
import documentsRouter from './routes/documents.js';
import expensesRouter from './routes/expenses.js';
import payrollRouter from './routes/payroll.js';
import performanceRouter from './routes/performance.js';
import settingsRouter from './routes/settings.js';
import emailRouter from './routes/email.js';
import auditRouter from './routes/audit.js';
import checklistRouter from './routes/checklist.js';
import recruitmentRouter from './routes/recruitment.js';
import remindersRouter from './routes/reminders.js';
import shiftsRouter from './routes/shifts.js';
import timesheetsRouter from './routes/timesheets.js';
import trainingRouter from './routes/training.js';

initFirebase();

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

app.use(express.json({ limit: '10mb' }));

/* ── API Routes ── */
app.use('/api/users', usersRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/holidays', holidaysRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/email', emailRouter);
app.use('/api/audit', auditRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/timesheets', timesheetsRouter);
app.use('/api/training', trainingRouter);

/* ── Gemini AI ── */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const MODELS = {
  primary: 'gemini-2.5-flash',
  fallback: 'gemini-2.5-flash-lite',
};

async function generateWithRetry(modelCalls, retries = 2) {
  for (const { model, contents, config } of modelCalls) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({ model, contents, config });
        return response.text || '';
      } catch (e) {
        const isTransient = e.message?.includes('503') ||
          e.message?.includes('429') ||
          e.message?.includes('UNAVAILABLE') ||
          e.message?.includes('RESOURCE_EXHAUSTED');
        if (attempt < retries && isTransient) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        if (attempt >= retries && isTransient) break;
        throw e;
      }
    }
  }
  throw new Error('All models exhausted');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const contents = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const config = systemInstruction ? { systemInstruction } : undefined;
    const text = await generateWithRetry([
      { model: MODELS.primary, contents, config },
      { model: MODELS.fallback, contents, config },
    ]);
    res.json({ text });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fast-chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const text = await generateWithRetry([
      { model: MODELS.primary, contents },
      { model: MODELS.fallback, contents },
    ]);
    res.json({ text });
  } catch (error) {
    console.error('Fast chat API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ── Static serving (production) ── */
app.use(express.static('dist'));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile('dist/index.html', { root: '.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
