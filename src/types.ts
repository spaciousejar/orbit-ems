export type UserStatus = 'Active' | 'Inactive' | 'On Leave';

export type UserRole = 'admin' | 'hr_manager' | 'team_lead' | 'employee';

export interface User {
  uid: string;
  id?: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  displayName?: string | null;
  employeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserProfile = User;

export type HolidayType = 'Public' | 'Company' | 'Optional';

export interface Holiday {
  id?: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id?: string;
  employeeId: string;
  employeeName: string;
  uid: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason?: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Attendance {
  id?: string;
  employeeId: string;
  employeeName: string;
  uid: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'Present' | 'Late' | 'Absent' | 'Half Day';
  location?: string;
  notes?: string;
}

export interface TimesheetEntry {
  date: string;
  hours: number;
  description: string;
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface Timesheet {
  id?: string;
  employeeId: string;
  employeeName: string;
  uid: string;
  weekStarting: string;
  entries: TimesheetEntry[];
  totalHours: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

export type ReminderType = 'task' | 'leave' | 'holiday';

export interface Reminder {
  id?: string;
  userId: string;
  type: ReminderType;
  relatedId: string; // ID of the task or leave request
  reminderTime: string; // ISO string
  message: string;
  read: boolean;
  createdAt: string;
}

export interface JobPosting {
  id?: string;
  title: string;
  department: string;
  description: string;
  status: 'Open' | 'Closed';
  createdAt: string;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  assignedTo: string; // employeeId (uid)
  assignedToName: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: string;
  createdAt: string;
}

export interface Applicant {
  id?: string;
  jobId: string;
  name: string;
  email: string;
  resumeURL: string;
  status: 'Applied' | 'Interviewing' | 'Rejected' | 'Hired';
  createdAt: string;
}

export type ChecklistItemStatus = 'Pending' | 'Completed';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  status: ChecklistItemStatus;
  completedAt?: string;
  completedBy?: string;
}

export type ProcessStatus = 'In Progress' | 'Completed' | 'Cancelled';

export interface OnboardingProcess {
  id?: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  status: ProcessStatus;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OffboardingProcess {
  id?: string;
  employeeId: string;
  employeeName: string;
  lastWorkingDay: string;
  status: ProcessStatus;
  items: ChecklistItem[];
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id?: string;
  name: string;
  logoURL?: string;
  address?: string;
  contactEmail?: string;
  workingHours: {
    start: string;
    end: string;
  };
  leavePolicies: {
    annualLimit: number;
    sickLimit: number;
  };
  updatedAt: string;
}

export interface UserSettings {
  uid: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    leaveUpdates: boolean;
    taskAssignments: boolean;
  };
  updatedAt: string;
}

// 14. Payroll Management Types
export interface SalaryStructure {
  id?: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    meal: number;
  };
  deductions: {
    tax: number;
    providentFund: number;
    insurance: number;
  };
  updatedAt: string;
}

export interface PayrollRun {
  id?: string;
  period: string; // e.g. "2026-06"
  status: 'Processing' | 'Approved' | 'Disbursed';
  totalBase: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNet: number;
  runDate: string;
  processedBy: string;
}

export interface SalarySlip {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  period: string; // "2026-06"
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  taxAmount: number;
  status: 'Draft' | 'Paid';
  paidAt?: string;
}

// 15. Performance Management Types
export interface Goal {
  id?: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Deferred';
  progress: number; // 0 to 100
  createdAt: string;
}

export interface PerformanceAppraisal {
  id?: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. "2026 Q2"
  selfRating: number;
  managerRating: number;
  feedbackSelf: string;
  feedbackManager: string;
  overallScore: number; // e.g. 1 to 5
  pipRequired: boolean;
  status: 'Draft' | 'Submitted' | 'Reviewed';
  updatedAt: string;
}

// 16. Expense Management Types
export interface ExpenseClaim {
  id?: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'Travel' | 'Meals' | 'Software' | 'Hardware' | 'Office Supplies' | 'Other';
  amount: number;
  currency: string;
  description: string;
  receiptURL?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
}

// 17. Time & Shift Scheduling Types
export interface ShiftSchedule {
  id?: string;
  employeeId: string;
  employeeName: string;
  date: string; // "YYYY-MM-DD"
  shiftType: 'Morning' | 'Afternoon' | 'Night' | 'Off'; // morning: 8am-4pm, afternoon: 4pm-12am, night: 12am-8am
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: string;
}

export interface ShiftSwapRequest {
  id?: string;
  requesterId: string;
  requesterName: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  requesterShiftId: string;
  targetShiftId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
  createdAt: string;
}

// 18. Training & Development Types
export interface Course {
  id?: string;
  title: string;
  provider: string;
  description: string;
  skillsGained: string[];
  durationString: string; // e.g. "4 weeks"
  status: 'Active' | 'Archived';
  createdAt: string;
}

export interface CourseNomination {
  id?: string;
  courseId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  feedback?: string;
  nominatedBy: string;
  createdAt: string;
}

// 19. Document Management Types
export interface EmployeeDocument {
  id?: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'Offer Letter' | 'Contract' | 'ID Proof' | 'Certificate' | 'Other';
  fileURL: string;
  fileName: string;
  expiryDate?: string;
  status: 'Active' | 'Expired' | 'Pending Review';
  uploadedBy: string;
  createdAt: string;
}
