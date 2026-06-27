import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function SeedDatabase() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const seed = async () => {
    setLoading(true);
    setStatus('Starting...');
    const now = new Date().toISOString();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { setStatus('Not logged in'); setLoading(false); return; }

    try {
      // Departments
      const depts = ['Engineering', 'Human Resources', 'Marketing', 'Design', 'Sales', 'Finance', 'Operations'];
      for (const name of depts) {
        await addDoc(collection(db, 'departments'), { name, createdAt: now, updatedAt: now });
      }
      setStatus('✅ Departments');

      // Seed employees (also creates auth users if we had admin SDK — here we just seed the user doc for the current user + sample docs)
      const sampleUsers = [
        { uid: user.uid, firstName: 'Admin', lastName: 'User', name: user.displayName || 'Admin User', email: user.email || 'admin@orbitems.com', role: 'admin', jobTitle: 'System Administrator', status: 'Active', phone: '+1-555-0100', department: 'Engineering', employeeId: 'EMP-001' },
        { uid: '', firstName: 'Sarah', lastName: 'Johnson', name: 'Sarah Johnson', email: 'sarah@orbitems.com', role: 'hr_manager', jobTitle: 'HR Manager', status: 'Active', phone: '+1-555-0101', department: 'Human Resources', employeeId: 'EMP-002' },
        { uid: '', firstName: 'Mike', lastName: 'Chen', name: 'Mike Chen', email: 'mike@orbitems.com', role: 'team_lead', jobTitle: 'Engineering Lead', status: 'Active', phone: '+1-555-0102', department: 'Engineering', employeeId: 'EMP-003' },
        { uid: '', firstName: 'Emma', lastName: 'Davis', name: 'Emma Davis', email: 'emma@orbitems.com', role: 'employee', jobTitle: 'Software Engineer', status: 'Active', phone: '+1-555-0103', department: 'Engineering', employeeId: 'EMP-004' },
        { uid: '', firstName: 'James', lastName: 'Wilson', name: 'James Wilson', email: 'james@orbitems.com', role: 'employee', jobTitle: 'Marketing Specialist', status: 'Active', phone: '+1-555-0104', department: 'Marketing', employeeId: 'EMP-005' },
      ];

      // Use server-side UIDs as doc IDs (just generate unique IDs client-side)
      for (const u of sampleUsers) {
        const data = { ...u, uid: u.uid || crypto.randomUUID(), createdAt: now, updatedAt: now };
        await addDoc(collection(db, 'users'), data);
      }
      setStatus('✅ Users');

      // Fetch the user docs we just created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type UserDoc = Record<string, any> & { id: string };
      const userSnap = await getDocs(collection(db, 'users'));
      const users: UserDoc[] = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const adminUid = users.find(u => u.role === 'admin')?.uid || user.uid;
      const uidList = users.map(u => ({ uid: u.uid, name: u.name, email: u.email }));

      if (uidList.length === 0) { setStatus('No users found'); setLoading(false); return; }

      // Attendance
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      for (let day = 1; day <= 20; day++) {
        const dateStr = `${yyyy}-${mm}-${String(day).padStart(2, '0')}`;
        const dow = new Date(yyyy, today.getMonth(), day).getDay();
        if (dow === 0 || dow === 6) continue;
        const idx = day % uidList.length;
        const u = uidList[idx];
        const statuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Present', 'Absent'];
        const s = statuses[day % statuses.length];
        await addDoc(collection(db, 'attendance'), {
          employeeId: u.uid, uid: u.uid, employeeName: u.name,
          date: dateStr, clockIn: `${dateStr}T08:${String(10 + day).padStart(2, '0')}:00Z`,
          clockOut: s === 'Absent' ? null : `${dateStr}T17:${String(day * 3).padStart(2, '0')}:00Z`,
          status: s, location: 'Main Office', notes: s === 'Late' ? 'Traffic delay' : '',
          createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Attendance');

      // Tasks
      const tasks = [
        { title: 'Q2 Performance Reviews', priority: 'High', status: 'In Progress' },
        { title: 'Update Onboarding Documentation', priority: 'Medium', status: 'Todo' },
        { title: 'Fix Login Page Bug', priority: 'High', status: 'Completed' },
        { title: 'Design New Dashboard Layout', priority: 'Medium', status: 'In Progress' },
        { title: 'Prepare Monthly Report', priority: 'Low', status: 'Todo' },
        { title: 'Conduct Team Standup', priority: 'Medium', status: 'Completed' },
        { title: 'Update Security Policies', priority: 'High', status: 'Todo' },
        { title: 'Migrate Legacy Data', priority: 'Medium', status: 'In Progress' },
        { title: 'Client Meeting Preparation', priority: 'High', status: 'Completed' },
        { title: 'Code Review Sprint 12', priority: 'Medium', status: 'In Progress' },
        { title: 'Update Employee Handbook', priority: 'Low', status: 'Todo' },
        { title: 'Deploy Hotfix v2.1.1', priority: 'High', status: 'Completed' },
      ];
      for (let i = 0; i < tasks.length; i++) {
        const u = uidList[i % uidList.length];
        const due = new Date(today); due.setDate(due.getDate() + (i + 1) * 3);
        await addDoc(collection(db, 'tasks'), {
          title: tasks[i].title, description: `Task: ${tasks[i].title}`,
          assignedTo: u.uid, assignedToName: u.name, assignedBy: adminUid,
          dueDate: due.toISOString().split('T')[0], status: tasks[i].status,
          priority: tasks[i].priority, createdBy: adminUid, createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Tasks');

      // Leaves
      const leaveTypes = ['Annual', 'Sick', 'Annual', 'Personal', 'Sick'];
      const leaveStatuses = ['Approved', 'Approved', 'Pending', 'Approved', 'Rejected'];
      for (let i = 0; i < 5; i++) {
        const u = uidList[i % uidList.length];
        const start = new Date(today); start.setDate(start.getDate() + 5 + i * 7);
        const end = new Date(start); end.setDate(end.getDate() + (i % 3) + 1);
        await addDoc(collection(db, 'leaves'), {
          employeeId: u.uid, uid: u.uid, employeeName: u.name,
          startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0],
          type: leaveTypes[i], status: leaveStatuses[i], reason: `Leave for ${leaveTypes[i].toLowerCase()} purposes`,
          approvedBy: leaveStatuses[i] !== 'Pending' ? adminUid : null,
          approvedByName: leaveStatuses[i] !== 'Pending' ? 'Admin User' : null,
          createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Leaves');

      // Holidays
      const holidays = [
        { name: 'New Year', date: `${yyyy}-01-01`, type: 'Public' },
        { name: 'Memorial Day', date: `${yyyy}-05-25`, type: 'Public' },
        { name: 'Independence Day', date: `${yyyy}-07-04`, type: 'Public' },
        { name: 'Labor Day', date: `${yyyy}-09-07`, type: 'Public' },
        { name: 'Thanksgiving', date: `${yyyy}-11-26`, type: 'Public' },
        { name: 'Christmas', date: `${yyyy}-12-25`, type: 'Public' },
        { name: 'Company Foundation Day', date: `${yyyy}-03-15`, type: 'Company' },
        { name: 'Summer Friday', date: `${yyyy}-06-20`, type: 'Optional' },
      ];
      for (const h of holidays) {
        await addDoc(collection(db, 'holidays'), {
          ...h, description: `${h.name} holiday`, createdBy: adminUid, createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Holidays');

      // Announcements
      const announcements = [
        { title: 'Welcome to Orbit EMS!', content: 'Explore all features including attendance tracking, leave management, and AI-powered analytics.', type: 'info', priority: 'High' },
        { title: 'Q2 Goals Announced', content: 'Company-wide goals for Q2 are now live.', type: 'info', priority: 'Medium' },
        { title: 'Office Closure - Maintenance', content: 'The office will be closed this Saturday for scheduled maintenance.', type: 'warning', priority: 'Low' },
        { title: 'New Benefits Package', content: 'Updated health and wellness benefits are now available.', type: 'success', priority: 'High' },
      ];
      for (const a of announcements) {
        await addDoc(collection(db, 'announcements'), { ...a, createdBy: adminUid, createdAt: now, updatedAt: now });
      }
      setStatus('✅ Announcements');

      // Expenses
      const expenses = [
        { title: 'Team Lunch', category: 'Meals', amount: 245.50, status: 'Approved' },
        { title: 'AWS Credits', category: 'Software', amount: 1200, status: 'Pending' },
        { title: 'Office Supplies', category: 'Office Supplies', amount: 89.99, status: 'Approved' },
        { title: 'Flight to NYC', category: 'Travel', amount: 890, status: 'Approved' },
        { title: 'New Monitor', category: 'Hardware', amount: 450, status: 'Rejected' },
        { title: 'Conference Tickets', category: 'Travel', amount: 1500, status: 'Pending' },
      ];
      for (let i = 0; i < expenses.length; i++) {
        const u = uidList[i % uidList.length];
        const e = expenses[i];
        await addDoc(collection(db, 'expenses'), {
          employeeId: u.uid, employeeName: u.name, title: e.title, category: e.category,
          amount: e.amount, currency: 'USD', description: `Expense for ${e.title}`,
          status: e.status, approvedBy: e.status !== 'Pending' ? adminUid : null,
          approvedByName: e.status !== 'Pending' ? 'Admin User' : null, createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Expenses');

      // Goals
      const goals = [
        { title: 'Complete Certification', description: 'Complete AWS Solutions Architect certification', targetDate: `${yyyy}-08-15`, status: 'In Progress', progress: 45 },
        { title: 'Improve Test Coverage', description: 'Increase unit test coverage to 80%', targetDate: `${yyyy}-07-01`, status: 'In Progress', progress: 60 },
        { title: 'Onboard 5 New Clients', description: 'Successfully onboard 5 new enterprise clients', targetDate: `${yyyy}-06-30`, status: 'Not Started', progress: 0 },
        { title: 'Reduce Page Load Time', description: 'Reduce homepage load time by 40%', targetDate: `${yyyy}-09-01`, status: 'In Progress', progress: 30 },
        { title: 'Team Building Event', description: 'Organize quarterly team building event', targetDate: `${yyyy}-05-20`, status: 'Completed', progress: 100 },
      ];
      for (let i = 0; i < goals.length; i++) {
        const u = uidList[i % uidList.length];
        const g = goals[i];
        await addDoc(collection(db, 'goals'), {
          employeeId: u.uid, employeeName: u.name, title: g.title, description: g.description,
          targetDate: g.targetDate, status: g.status, progress: g.progress, createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Goals');

      // Salary structures
      const salaries = [
        { baseSalary: 120000, allowances: { housing: 2000, transport: 500, meal: 300 }, deductions: { tax: 15000, providentFund: 5000, insurance: 2000 } },
        { baseSalary: 85000, allowances: { housing: 1500, transport: 400, meal: 250 }, deductions: { tax: 10000, providentFund: 3500, insurance: 1500 } },
        { baseSalary: 110000, allowances: { housing: 1800, transport: 450, meal: 280 }, deductions: { tax: 13000, providentFund: 4500, insurance: 1800 } },
      ];
      for (let i = 0; i < salaries.length; i++) {
        const u = uidList[i % uidList.length];
        const s = salaries[i];
        await setDoc(doc(db, 'salary_structures', u.uid), {
          employeeId: u.uid, employeeName: u.name, ...s, updatedAt: now,
        });
      }
      setStatus('✅ Salary Structures');

      // Payroll runs
      for (let i = 0; i < 3; i++) {
        const d = new Date(today); d.setMonth(d.getMonth() - i);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        await addDoc(collection(db, 'payroll_runs'), {
          period, status: i === 0 ? 'Processing' : 'Disbursed',
          totalBase: 485000, totalAllowances: 48500, totalDeductions: 89500, totalNet: 444000,
          runDate: d.toISOString().split('T')[0], processedBy: 'Admin User', createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Payroll Runs');

      // Appraisals
      for (let i = 0; i < 5; i++) {
        const u = uidList[i % uidList.length];
        await addDoc(collection(db, 'appraisals'), {
          employeeId: u.uid, employeeName: u.name, period: `${yyyy} Q1`,
          selfRating: 3 + (i % 3), managerRating: 3 + ((i + 1) % 3),
          feedbackSelf: 'Consistently delivering on goals.', feedbackManager: 'Great performance!',
          overallScore: 3 + ((i + 1) % 3), pipRequired: i === 4,
          status: ['Reviewed', 'Draft', 'Reviewed', 'Submitted', 'Draft'][i],
          createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Appraisals');

      // Employee documents
      const docTypes = ['Offer Letter', 'Contract', 'ID Proof', 'Certificate', 'Other'];
      for (let i = 0; i < 5; i++) {
        const u = uidList[i % uidList.length];
        await addDoc(collection(db, 'employee_documents'), {
          employeeId: u.uid, employeeName: u.name, title: `${u.name} - ${docTypes[i]}`,
          category: docTypes[i], fileURL: '#', fileName: `${docTypes[i].toLowerCase().replace(/\s+/g, '-')}.pdf`,
          status: ['Active', 'Active', 'Active', 'Expired', 'Pending Review'][i],
          uploadedBy: adminUid, createdAt: now, updatedAt: now,
        });
      }
      setStatus('✅ Employee Documents');

      // Notifications
      const messages = ['Leave request approved', 'New task assigned', 'Payroll processed', 'Profile needs update', 'Team meeting tomorrow'];
      for (const u of uidList) {
        for (let i = 0; i < messages.length; i++) {
          await addDoc(collection(db, 'notifications'), {
            userId: u.uid, message: messages[i], type: ['info', 'warning', 'success'][i % 3],
            read: i < 2, createdAt: now, updatedAt: now,
          });
        }
      }
      setStatus('✅ Notifications');

      // User settings
      for (const u of uidList) {
        await setDoc(doc(db, 'user-settings', u.uid), {
          uid: u.uid, theme: 'dark',
          notifications: { email: true, push: true, leaveUpdates: true, taskAssignments: true },
          updatedAt: now,
        });
      }
      setStatus('🎉 **ALL DATA SEEDED!** You can now use the app.');

    } catch (err: unknown) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center border border-zinc-800">
        <h1 className="text-2xl font-bold text-white mb-2">Orbit EMS</h1>
        <h2 className="text-lg text-zinc-400 mb-6">Seed Database</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Click the button below to populate the database with sample data for all 18 collections.
        </p>
        <button
          onClick={seed}
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? 'Seeding...' : '🌱 Seed Database'}
        </button>
        {status && (
          <p className="mt-4 text-sm text-zinc-300 whitespace-pre-wrap">{status}</p>
        )}
      </div>
    </div>
  );
}
