import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { holidayService } from '../services/holidayService';
import { reminderService } from '../services/reminderService';
import { Holiday, HolidayType, UserProfile } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HolidayCalendarProps {
  profile: UserProfile;
}

export function HolidayCalendar({ profile }: HolidayCalendarProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [reminderHoliday, setReminderHoliday] = useState<Holiday | null>(null);
  const [reminderTime, setReminderTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'Public' as HolidayType,
    description: ''
  });

  const isAdmin = profile.role === 'admin';

  useEffect(() => {
    const unsubscribe = holidayService.subscribeToHolidays(null, (data) => {
      setHolidays(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddHoliday = async () => {
    try {
      if (!formData.name || !formData.date) {
        toast.error("Please fill in all required fields");
        return;
      }
      await holidayService.addHoliday({
        ...formData,
        createdBy: profile.uid || 'admin',
        createdAt: new Date().toISOString(),
      });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Public',
        description: ''
      });
      toast.success("Holiday added successfully");
    } catch (error) {
      toast.error("Failed to add holiday");
      console.error(error);
    }
  };

  const handleSetReminder = async () => {
    if (!reminderHoliday || !reminderTime) return;
    try {
      await reminderService.addReminder({
        userId: profile.uid,
        type: 'holiday',
        relatedId: reminderHoliday.id!,
        reminderTime: new Date(reminderTime).toISOString(),
        message: `Upcoming holiday: ${reminderHoliday.name}`,
        read: false
      });
      toast.success("Reminder set successfully");
      setReminderHoliday(null);
      setReminderTime('');
    } catch (error) {
      toast.error("Failed to set reminder");
      console.error(error);
    }
  };

  const handleUpdateHoliday = async () => {
    if (!editingHoliday?.id) return;
    try {
      await holidayService.updateHoliday(editingHoliday.id, formData);
      setIsEditDialogOpen(false);
      setEditingHoliday(null);
      toast.success("Holiday updated successfully");
    } catch (error) {
      toast.error("Failed to update holiday");
      console.error(error);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await holidayService.deleteHoliday(id);
      toast.success("Holiday deleted successfully");
    } catch (error) {
      toast.error("Failed to delete holiday");
      console.error(error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHolidaysForDay = (day: Date) => {
    return holidays.filter(h => isSameDay(parseISO(h.date), day));
  };

  const typeColors = {
    Public: 'bg-red-500/10 text-red-500 border-red-500/20',
    Company: 'bg-primary/10 text-primary border-primary/20',
    Optional: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Holiday Calendar</h2>
          <p className="text-muted-foreground text-sm">View and manage company-wide holidays.</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger 
              render={
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  Add Holiday
                </Button>
              }
            />
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Holiday</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Holiday Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-card border-border"
                    placeholder="e.g. New Year's Day"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v) => setFormData({...formData, type: v ?? 'Public'})}
                    >
                      <SelectTrigger className="bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="bg-card border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddHoliday} className="bg-primary hover:bg-primary/90">Save Holiday</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 bg-card border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="hover:bg-accent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentDate(new Date())}
                className="text-xs px-2 w-auto hover:bg-accent"
              >
                Today
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="hover:bg-accent"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Padding for start of month */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="h-24 border-r border-b border-border bg-muted" />
              ))}
              
              {days.map((day, i) => {
                const dayHolidays = getHolidaysForDay(day);
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "h-24 border-r border-b border-border p-2 transition-colors",
                      !isSameMonth(day, currentDate) ? "bg-muted" : "hover:bg-accent",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-medium",
                        isToday(day) ? "text-primary" : "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayHolidays.map((h, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded border truncate",
                            typeColors[h.type]
                          )}
                          title={h.name}
                        >
                          {h.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Holidays List */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {holidays
                .filter(h => parseISO(h.date) >= new Date())
                .slice(0, 5)
                .map((holiday, i) => (
                  <div key={i} className="flex items-start justify-between group">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{format(parseISO(holiday.date), 'MMM')}</span>
                        <span className="text-sm text-foreground font-bold leading-none">{format(parseISO(holiday.date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {holiday.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 border-none", typeColors[holiday.type])}>
                            {holiday.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{format(parseISO(holiday.date), 'EEEE')}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent className="bg-card border-border text-foreground">
                          <DropdownMenuItem onClick={() => {
                            setEditingHoliday(holiday);
                            setFormData({
                              name: holiday.name,
                              date: holiday.date,
                              type: holiday.type,
                              description: holiday.description || ''
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400 focus:text-red-400"
                            onClick={() => holiday.id && handleDeleteHoliday(holiday.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setReminderHoliday(holiday)}
                      title="Set Reminder"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              {holidays.length === 0 && (
                <div className="text-center py-8">
                  <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming holidays scheduled.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-widest">Holiday Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Orbit Inc provides paid time off for all public holidays. Optional holidays can be taken with prior approval from your team lead.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Holiday Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="bg-card border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input 
                  id="edit-date" 
                  type="date"
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v ?? 'Public'})}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input 
                id="edit-description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="bg-card border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateHoliday} className="bg-primary hover:bg-primary/90">Update Holiday</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={!!reminderHoliday} onOpenChange={() => setReminderHoliday(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Set Reminder for {reminderHoliday?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder Date & Time</Label>
              <Input 
                id="reminder-time" 
                type="datetime-local"
                value={reminderTime} 
                onChange={e => setReminderTime(e.target.value)}
                className="bg-card border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReminderHoliday(null)}>Cancel</Button>
            <Button onClick={handleSetReminder} className="bg-primary hover:bg-primary/90">Set Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
