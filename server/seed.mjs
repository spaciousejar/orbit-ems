import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getAuth } from 'firebase-admin/auth';
import { initFirebase, getDb } from './firebase.js';

initFirebase();
const db = getDb();

const sampleUsers = [
  { firstName: 'Admin', lastName: 'User', name: 'Admin User', email: 'admin@orbitems.com', role: 'admin', jobTitle: 'System Administrator', status: 'Active', phone: '+1-555-0100', department: 'Engineering' },
  { firstName: 'Sarah', lastName: 'Johnson', name: 'Sarah Johnson', email: 'sarah@orbitems.com', role: 'hr_manager', jobTitle: 'HR Manager', status: 'Active', phone: '+1-555-0101', department: 'Human Resources' },
  { firstName: 'Mike', lastName: 'Chen', name: 'Mike Chen', email: 'mike@orbitems.com', role: 'team_lead', jobTitle: 'Engineering Lead', status: 'Active', phone: '+1-555-0102', department: 'Engineering' },
  { firstName: 'Emma', lastName: 'Davis', name: 'Emma Davis', email: 'emma@orbitems.com', role: 'employee', jobTitle: 'Software Engineer', status: 'Active', phone: '+1-555-0103', department: 'Engineering' },
  { firstName: 'James', lastName: 'Wilson', name: 'James Wilson', email: 'james@orbitems.com', role: 'employee', jobTitle: 'Marketing Specialist', status: 'Active', phone: '+1-555-0104', department: 'Marketing' },
  { firstName: 'Lisa', lastName: 'Brown', name: 'Lisa Brown', email: 'lisa@orbitems.com', role: 'employee', jobTitle: 'UX Designer', status: 'Active', phone: '+1-555-0105', department: 'Design' },
  { firstName: 'Robert', lastName: 'Taylor', name: 'Robert Taylor', email: 'robert@orbitems.com', role: 'employee', jobTitle: 'Backend Developer', status: 'On Leave', phone: '+1-555-0106', department: 'Engineering' },
  { firstName: 'Amy', lastName: 'Martinez', name: 'Amy Martinez', email: 'amy@orbitems.com', role: 'employee', jobTitle: 'Sales Representative', status: 'Active', phone: '+1-555-0107', department: 'Sales' },
  { firstName: 'David', lastName: 'Anderson', name: 'David Anderson', email: 'david@orbitems.com', role: 'employee', jobTitle: 'DevOps Engineer', status: 'Active', phone: '+1-555-0108', department: 'Engineering' },
  { firstName: 'Sophia', lastName: 'Thomas', name: 'Sophia Thomas', email: 'sophia@orbitems.com', role: 'hr_manager', jobTitle: 'HR Coordinator', status: 'Active', phone: '+1-555-0109', department: 'Human Resources' },
];

const departments = ['Engineering', 'Human Resources', 'Marketing', 'Design', 'Sales', 'Finance', 'Operations'];

async function seed() {
  console.log('🌱 Seeding Orbit-EMS database...\n');

  let adminDocId = null;
  const uidMap = {};

  const existing = await db.collection('users').limit(1).get();

  if (existing.empty) {
    console.log('📋 Creating sample auth users...');
    for (const u of sampleUsers) {
      try {
        const record = await getAuth().createUser({
          email: u.email,
          displayName: `${u.firstName} ${u.lastName}`,
          password: 'Password123!',
          emailVerified: true,
        });
        uidMap[u.email] = record.uid;
        if (u.role === 'admin') adminDocId = record.uid;
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(u.email);
          uidMap[u.email] = userRecord.uid;
          if (u.role === 'admin') adminDocId = userRecord.uid;
        } else {
          console.error(`  ❌ Failed to create user ${u.email}:`, err.message);
        }
      }
    }
  } else {
    console.log('📋 Users already exist, mapping existing...');
    const allUsers = await db.collection('users').get();
    allUsers.forEach(doc => {
      const data = doc.data();
      uidMap[data.email] = data.uid || doc.id;
      if (data.role === 'admin') adminDocId = data.uid || doc.id;
    });
    for (const u of sampleUsers) {
      if (!uidMap[u.email]) {
        try {
          const userRecord = await getAuth().getUserByEmail(u.email);
          uidMap[u.email] = userRecord.uid;
        } catch { }
      }
    }
  }

  if (!adminDocId && Object.values(uidMap).length > 0) {
    adminDocId = Object.values(uidMap)[0];
  }

  const now = new Date().toISOString();

  console.log('\n📁 Seeding departments...');
  for (const name of departments) {
    await db.collection('departments').add({ name, createdAt: now, updatedAt: now });
    console.log(`  ✅ ${name}`);
  }

  console.log('\n👤 Seeding users...');
  let userIndex = 0;
  for (const u of sampleUsers) {
    const uid = uidMap[u.email];
    if (!uid) { console.log(`  ⏭️  ${u.email} (no auth UID, skipping)`); continue; }
    const docId = `${uid}`;
    const userData = {
      uid,
      ...u,
      department: departments[userIndex % departments.length],
      createdAt: now,
      updatedAt: now,
      employeeId: `EMP-${String(userIndex + 1).padStart(3, '0')}`,
    };
    await db.collection('users').doc(docId).set(userData);
    console.log(`  ✅ ${u.name} (${u.email}) — ${userData.department}`);
    userIndex++;
  }

  const uidList = Object.values(uidMap);
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');

  console.log('\n⏰ Seeding attendance records...');
  for (let day = 1; day <= 20; day++) {
    const dateStr = `${yyyy}-${mm}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(yyyy, today.getMonth(), day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const employeeIdx = day % uidList.length;
    const uid = uidList[employeeIdx];
    const user = sampleUsers[employeeIdx] || sampleUsers[0];
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Present', 'Absent'];
    const status = statuses[day % statuses.length];
    await db.collection('attendance').add({
      employeeId: uid,
      uid,
      employeeName: user.name,
      date: dateStr,
      clockIn: `${dateStr}T08:${String(10 + day).padStart(2, '0')}:00Z`,
      clockOut: status === 'Absent' ? null : `${dateStr}T17:${String(day * 3).padStart(2, '0')}:00Z`,
      status,
      location: 'Main Office',
      notes: status === 'Late' ? 'Traffic delay' : '',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 20 attendance records seeded');

  console.log('\n📋 Seeding tasks...');
  const taskTemplates = [
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
  for (let i = 0; i < taskTemplates.length; i++) {
    const assignTo = uidList[i % uidList.length];
    const assignToUser = sampleUsers[i % sampleUsers.length];
    const task = taskTemplates[i];
    const due = new Date(today);
    due.setDate(due.getDate() + (i + 1) * 3);
    await db.collection('tasks').add({
      title: task.title,
      description: `Task: ${task.title}`,
      assignedTo: assignTo,
      assignedToName: assignToUser.name,
      assignedBy: adminDocId,
      dueDate: due.toISOString().split('T')[0],
      status: task.status,
      priority: task.priority,
      createdBy: adminDocId,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 12 tasks seeded');

  console.log('\n🏖️ Seeding leave requests...');
  const leaveTypes = ['Annual', 'Sick', 'Annual', 'Personal', 'Sick'];
  const leaveStatuses = ['Approved', 'Approved', 'Pending', 'Approved', 'Rejected'];
  for (let i = 0; i < 5; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 5 + i * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (i % 3) + 1);
    await db.collection('leaves').add({
      employeeId: uid,
      uid,
      employeeName: user.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      type: leaveTypes[i],
      status: leaveStatuses[i],
      reason: `Leave for ${leaveTypes[i].toLowerCase()} purposes`,
      approvedBy: leaveStatuses[i] !== 'Pending' ? adminDocId : null,
      approvedByName: leaveStatuses[i] !== 'Pending' ? 'Admin User' : null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 5 leave requests seeded');

  console.log('\n🎉 Seeding holidays...');
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
    await db.collection('holidays').add({
      ...h,
      description: `${h.name} holiday`,
      createdBy: adminDocId,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 8 holidays seeded');

  console.log('\n📢 Seeding announcements...');
  const announcements = [
    { title: 'Welcome to Orbit EMS!', content: 'We are excited to have you onboard. Explore all features including attendance tracking, leave management, and AI-powered analytics.', type: 'info', priority: 'High' },
    { title: 'Q2 Goals Announced', content: 'Company-wide goals for Q2 are now live. Please review and align your team objectives accordingly.', type: 'info', priority: 'Medium' },
    { title: 'Office Closure - Maintenance', content: 'The office will be closed this Saturday for scheduled maintenance. Remote work is available.', type: 'warning', priority: 'Low' },
    { title: 'New Benefits Package', content: 'Updated health and wellness benefits are now available. Check the HR portal for details.', type: 'success', priority: 'High' },
  ];
  for (const a of announcements) {
    await db.collection('announcements').add({
      ...a,
      createdBy: adminDocId,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 4 announcements seeded');

  console.log('\n💰 Seeding expenses...');
  const expenseData = [
    { title: 'Team Lunch', category: 'Meals', amount: 245.50, status: 'Approved' },
    { title: 'AWS Credits', category: 'Software', amount: 1200.00, status: 'Pending' },
    { title: 'Office Supplies', category: 'Office Supplies', amount: 89.99, status: 'Approved' },
    { title: 'Flight to NYC', category: 'Travel', amount: 890.00, status: 'Approved' },
    { title: 'New Monitor', category: 'Hardware', amount: 450.00, status: 'Rejected' },
    { title: 'Conference Tickets', category: 'Travel', amount: 1500.00, status: 'Pending' },
  ];
  for (let i = 0; i < expenseData.length; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    const e = expenseData[i];
    await db.collection('expenses').add({
      employeeId: uid,
      employeeName: user.name,
      title: e.title,
      category: e.category,
      amount: e.amount,
      currency: 'USD',
      description: `Expense for ${e.title}`,
      status: e.status,
      approvedBy: e.status !== 'Pending' ? adminDocId : null,
      approvedByName: e.status !== 'Pending' ? 'Admin User' : null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 6 expenses seeded');

  console.log('\n🎯 Seeding goals...');
  const goalData = [
    { title: 'Complete Certification', description: 'Complete AWS Solutions Architect certification', targetDate: `${yyyy}-08-15`, status: 'In Progress', progress: 45 },
    { title: 'Improve Test Coverage', description: 'Increase unit test coverage to 80%', targetDate: `${yyyy}-07-01`, status: 'In Progress', progress: 60 },
    { title: 'Onboard 5 New Clients', description: 'Successfully onboard 5 new enterprise clients this quarter', targetDate: `${yyyy}-06-30`, status: 'Not Started', progress: 0 },
    { title: 'Reduce Page Load Time', description: 'Reduce homepage load time by 40%', targetDate: `${yyyy}-09-01`, status: 'In Progress', progress: 30 },
    { title: 'Team Building Event', description: 'Organize quarterly team building event', targetDate: `${yyyy}-05-20`, status: 'Completed', progress: 100 },
  ];
  for (let i = 0; i < goalData.length; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    const g = goalData[i];
    await db.collection('goals').add({
      employeeId: uid,
      employeeName: user.name,
      title: g.title,
      description: g.description,
      targetDate: g.targetDate,
      status: g.status,
      progress: g.progress,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 5 goals seeded');

  console.log('\n💰 Seeding salary structures...');
  const salaryData = [
    { baseSalary: 120000, allowances: { housing: 2000, transport: 500, meal: 300 }, deductions: { tax: 15000, providentFund: 5000, insurance: 2000 } },
    { baseSalary: 85000, allowances: { housing: 1500, transport: 400, meal: 250 }, deductions: { tax: 10000, providentFund: 3500, insurance: 1500 } },
    { baseSalary: 110000, allowances: { housing: 1800, transport: 450, meal: 280 }, deductions: { tax: 13000, providentFund: 4500, insurance: 1800 } },
    { baseSalary: 95000, allowances: { housing: 1600, transport: 420, meal: 260 }, deductions: { tax: 11000, providentFund: 3800, insurance: 1600 } },
    { baseSalary: 75000, allowances: { housing: 1200, transport: 350, meal: 220 }, deductions: { tax: 8500, providentFund: 3000, insurance: 1200 } },
  ];
  for (let i = 0; i < salaryData.length; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    const s = salaryData[i];
    await db.collection('salary_structures').doc(uid).set({
      employeeId: uid,
      employeeName: user.name,
      ...s,
      updatedAt: now,
    });
  }
  console.log('  ✅ 5 salary structures seeded');

  console.log('\n💵 Seeding payroll runs...');
  for (let i = 0; i < 3; i++) {
    const periodDate = new Date(today);
    periodDate.setMonth(periodDate.getMonth() - i);
    const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
    await db.collection('payroll_runs').add({
      period,
      status: i === 0 ? 'Processing' : 'Disbursed',
      totalBase: 485000,
      totalAllowances: 48500,
      totalDeductions: 89500,
      totalNet: 444000,
      runDate: periodDate.toISOString().split('T')[0],
      processedBy: 'Admin User',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 3 payroll runs seeded');

  console.log('\n📊 Seeding appraisals...');
  for (let i = 0; i < 5; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    await db.collection('appraisals').add({
      employeeId: uid,
      employeeName: user.name,
      period: `${yyyy} Q1`,
      selfRating: 3 + (i % 3),
      managerRating: 3 + ((i + 1) % 3),
      feedbackSelf: 'I have been consistently delivering on my goals.',
      feedbackManager: 'Great performance this quarter. Keep it up!',
      overallScore: 3 + ((i + 1) % 3),
      pipRequired: i === 4,
      status: ['Reviewed', 'Draft', 'Reviewed', 'Submitted', 'Draft'][i],
      updatedAt: now,
    });
  }
  console.log('  ✅ 5 appraisals seeded');

  console.log('\n📄 Seeding employee documents...');
  const docTypes = ['Offer Letter', 'Contract', 'ID Proof', 'Certificate', 'Other'];
  for (let i = 0; i < 5; i++) {
    const uid = uidList[i % uidList.length];
    const user = sampleUsers[i % sampleUsers.length];
    await db.collection('employee_documents').add({
      employeeId: uid,
      employeeName: user.name,
      title: `${user.name} - ${docTypes[i]}`,
      category: docTypes[i],
      fileURL: `https://storage.example.com/documents/${uid}/${docTypes[i].toLowerCase().replace(/\s+/g, '-')}.pdf`,
      fileName: `${docTypes[i].toLowerCase().replace(/\s+/g, '-')}.pdf`,
      status: ['Active', 'Active', 'Active', 'Expired', 'Pending Review'][i],
      uploadedBy: adminDocId,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('  ✅ 5 documents seeded');

  console.log('\n🔔 Seeding notifications...');
  const notificationTypes = ['info', 'warning', 'success'];
  const notificationMessages = [
    'Your leave request has been approved',
    'New task assigned: Q2 Performance Reviews',
    'Payroll for June has been processed',
    'Your profile needs to be updated',
    'Team meeting at 2 PM tomorrow',
  ];
  for (const uid of uidList) {
    for (let i = 0; i < notificationMessages.length; i++) {
      await db.collection('notifications').add({
        userId: uid,
        message: notificationMessages[i],
        type: notificationTypes[i % notificationTypes.length],
        read: i < 2,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  console.log('  ✅ Notifications seeded for all users');

  console.log('\n⚙️ Seeding user settings...');
  for (const uid of uidList) {
    await db.collection('user-settings').doc(uid).set({
      uid,
      theme: 'dark',
      notifications: { email: true, push: true, leaveUpdates: true, taskAssignments: true },
      updatedAt: now,
    });
  }
  console.log('  ✅ User settings seeded');

  console.log('\n✨ Seeding complete!');
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Users: ${uidList.length}`);
  console.log(`   Attendance: 20 records`);
  console.log(`   Tasks: ${taskTemplates.length}`);
  console.log(`   Leaves: 5`);
  console.log(`   Holidays: ${holidays.length}`);
  console.log(`   Announcements: ${announcements.length}`);
  console.log(`   Expenses: ${expenseData.length}`);
  console.log(`   Goals: ${goalData.length}`);
  console.log(`   Salary Structures: ${salaryData.length}`);
  console.log(`   Payroll Runs: 3`);
  console.log(`   Appraisals: 5`);
  console.log(`   Documents: 5`);
  console.log(`   Notifications: seeded`);
  console.log(`   User Settings: seeded`);
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
