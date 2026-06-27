import { useState, useEffect } from 'react';
import { trainingService } from '../services/trainingService';
import { userService } from '../services/userService';
import { auditService } from '../services/auditService';
import { User, Course, CourseNomination } from '../types';
import { 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Award, 
  Search, 
  UserCheck, 
  CheckCircle,
  FileBadge2,
  Bookmark
} from 'lucide-react';
import { toast } from 'sonner';

export function TrainingManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [nominations, setNominations] = useState<CourseNomination[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // Form states - course
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('Orbit HR Learning');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [duration, setDuration] = useState('3 weeks');

  // Form states - nomination
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    userService.getAllUsers().then(e => {
      setEmployees(e);
      if (e.length > 0) setSelectedEmp(e[0]);
    });

    const unsubCourses = trainingService.subscribeToCourses((list) => {
      setCourses(list);
      if (list.length > 0 && !selectedCourse) setSelectedCourse(list[0]);
    });

    const unsubNominations = trainingService.subscribeToNominations(null, setNominations);

    return () => {
      unsubCourses();
      unsubNominations();
    };
  }, []);

  const handleAddCourse = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Course summary and description are mandatory');
      return;
    }

    try {
      const skillsArray = skills ? skills.split(',').map(s => s.trim()) : ['Systems Architecture'];
      await trainingService.addCourse({
        title,
        provider,
        description,
        skillsGained: skillsArray,
        durationString: duration,
        status: 'Active',
        createdAt: new Date().toISOString()
      });

      toast.success('Course registered in the company archives');
      setTitle('');
      setDescription('');
      setSkills('');
      
      await auditService.logAction('Training Added', undefined, title, `Provided by: ${provider}`);
    } catch {
      toast.error('Failed to register syllabus catalog course');
    }
  };

  const handleNominate = async () => {
    if (!selectedCourse || !selectedEmp) return;

    // Direct duplicates prevention
    if (nominations.some(n => n.courseId === selectedCourse.id && n.employeeId === selectedEmp.uid && n.status === 'Pending')) {
      toast.error(`${selectedEmp.firstName} is already nominated for this program and awaits HR decisions.`);
      return;
    }

    try {
      await trainingService.nominateEmployee({
        courseId: selectedCourse.id!,
        courseTitle: selectedCourse.title,
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        status: 'Approved', // Approved by default if administered by manager, otherwise wait
        nominatedBy: 'HR Admin',
        createdAt: new Date().toISOString()
      });

      toast.success('User successfully enrolled into active course curriculum!');
      
      await auditService.logAction(
        'Training Nomination Approved',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Syllabus Registered: ${selectedCourse.title} (Duration: ${selectedCourse.durationString})`
      );
    } catch {
      toast.error('Nominative enrollment pipeline threw standard database exception');
    }
  };

  const handleCompleteNomination = async (id: string, name: string, courseTitle: string) => {
    try {
      await trainingService.updateNominationStatus(id, 'Completed', 'Outstanding certificate completed.');
      toast.success(`${name} has successfully graduated and received certificates!`);
      
      await auditService.logAction(
        'Training Certificated',
        undefined,
        name,
        `Mastered: ${courseTitle}. Added credentials.`
      );
    } catch {
      toast.error('Failed updating development records status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-emerald" />
          Upskilling, Learning Paths & Certifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catalog internal courses, register employees for nominations, and trace professional certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Archive catalog and register */}
        <div className="space-y-6 lg:col-span-1">
          {/* Syllabus Register */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-emerald" />
              Add Course to Catalog
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. advanced react 19 & concurrent hooks"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Provider / Platform</label>
                <input
                  type="text"
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Nominal Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Gain Skills (comma sep)</label>
                  <input
                    type="text"
                    placeholder="Vite, State, SSR"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Brief Description</label>
                <textarea
                  placeholder="Covers rendering optimizations, server bundle sizes, and concurrent transitions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddCourse}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Register to Catalog
              </button>
            </div>
          </div>

          {/* Quick Nomination trigger card */}
          {courses.length > 0 && (
            <div className="bg-card border border-border p-5 rounded-xl space-y-4">
              <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-brand-emerald" />
                Nominate & Enroll
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Course Program</label>
                  <select
                    value={selectedCourse?.id || ''}
                    onChange={e => {
                      const course = courses.find(c => c.id === e.target.value);
                      if (course) setSelectedCourse(course);
                    }}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Candidate</label>
                  <select
                    value={selectedEmp?.uid || ''}
                    onChange={e => {
                      const emp = employees.find(emp => emp.uid === e.target.value);
                      if (emp) setSelectedEmp(emp);
                    }}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  >
                    {employees.map(emp => (
                      <option key={emp.uid} value={emp.uid}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleNominate}
                  className="w-full bg-emerald-650 hover:bg-emerald-600 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  Grant Admission
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive list log dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Learning Board */}
          <div className="bg-card border border-border p-5 rounded-xl">
            <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-brand-emerald" />
              Active Training Enlistment Directory
            </h3>

            {nominations.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-sm">
                No active training enrollments logged yet. Pick courses and nominate candidates.
              </div>
            ) : (
              <div className="space-y-3">
                {nominations.map(nom => (
                  <div key={nom.id} className="bg-zinc-950 border border-border p-4 rounded-xl flex items-center justify-between gap-4 transition hover:border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-success/10 text-success border border-success/20 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide">
                          Course Registered
                        </span>
                        <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border ${nom.status === 'Completed' ? 'bg-success/5 text-success border-success/20' : 'bg-primary/5 text-primary border-primary/20'}`}>
                          {nom.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{nom.courseTitle}</h4>
                      <div className="text-[10px] text-muted-foreground leading-none">
                        User Enrolled: <span className="font-bold text-muted-foreground">{nom.employeeName}</span>
                      </div>
                    </div>

                    {nom.status !== 'Completed' && (
                      <button
                        onClick={() => handleCompleteNomination(nom.id!, nom.employeeName, nom.courseTitle)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] py-1.5 px-3 rounded flex items-center gap-1 transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Graduate & Certify
                      </button>
                    )}
                    {nom.status === 'Completed' && (
                      <div className="text-brand-emerald font-medium text-xs flex items-center gap-1 select-none">
                        <FileBadge2 className="w-4 h-4" />
                        Certificated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Courses List Archives */}
          <div className="bg-card border border-border p-5 rounded-xl">
            <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-1.5 animate-pulse">
              <BookOpen className="w-4 h-4 text-brand-emerald" />
              Syllabus Catalog Archives
            </h3>

            {courses.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-sm">
                Catalog empty. Setup courses in the archive register.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                  <div key={course.id} className="border border-border bg-zinc-950 p-4 rounded-xl flex flex-col justify-between space-y-3 transition hover:border-border">
                    <div className="space-y-1.5">
                      <h4 className="text-foreground font-semibold text-sm leading-tight">{course.title}</h4>
                      <p className="text-xs text-zinc-450 leading-relaxed line-clamp-2">{course.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {course.skillsGained.map(skill => (
                          <span key={skill} className="bg-card border border-border text-[9px] text-muted-foreground font-semibold uppercase font-mono px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-border flex justify-between">
                      <span>By: {course.provider}</span>
                      <span className="font-bold text-muted-foreground">Duration: {course.durationString}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
