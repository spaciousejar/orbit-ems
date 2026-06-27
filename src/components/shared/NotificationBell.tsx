import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Notification, Reminder, UserProfile } from '../../types';
import { notificationService } from '../../services/notificationService';
import { reminderService } from '../../services/reminderService';
import { toast } from 'sonner';

export function NotificationBell({ profile, onTabChange }: { profile: UserProfile, onTabChange?: (tab: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const isInitialNotifsLoad = useRef(true);
  const isInitialRemindersLoad = useRef(true);
  const prevNotifs = useRef<Notification[]>([]);
  const prevReminders = useRef<Reminder[]>([]);

  useEffect(() => {
    const unsubNotifs = notificationService.subscribeToNotifications(profile.uid, (newNotifs) => {
      if (!isInitialNotifsLoad.current) {
        const addedNotifs = newNotifs.filter(n => !prevNotifs.current.find(p => p.id === n.id));
        addedNotifs.forEach(notif => {
          toast('New Notification', {
            description: notif.message,
            action: {
              label: 'View',
              onClick: () => onTabChange && onTabChange('notifications')
            }
          });
        });
      }
      isInitialNotifsLoad.current = false;
      prevNotifs.current = newNotifs;
      setNotifications(newNotifs);
    });

    const unsubReminders = reminderService.subscribeToReminders(profile.uid, (newReminders) => {
      if (!isInitialRemindersLoad.current) {
        const addedReminders = newReminders.filter(r => !prevReminders.current.find(p => p.id === r.id));
        addedReminders.forEach(reminder => {
          toast('New Reminder', {
            description: reminder.message,
            action: {
              label: 'View',
              onClick: () => onTabChange && onTabChange('notifications')
            }
          });
        });
      }
      isInitialRemindersLoad.current = false;
      prevReminders.current = newReminders;
      setReminders(newReminders);
    });

    return () => {
      unsubNotifs();
      unsubReminders();
    };
  }, [profile.uid, onTabChange]);

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const unreadReminders = reminders.filter(r => !r.read).length;
  const unreadCount = unreadNotifs + unreadReminders;

  const handleNotificationClick = (n: Notification) => {
    if (n.id) notificationService.markAsRead(n.id);
    if (onTabChange) {
      if (n.message.toLowerCase().includes('leave request')) {
        onTabChange('attendance-leave requests');
      }
    }
  };

  const handleReminderClick = (r: Reminder) => {
    if (r.id) reminderService.markAsRead(r.id);
    if (onTabChange) {
      if (r.type === 'leave') {
        onTabChange('attendance-leave requests');
      } else if (r.type === 'task') {
        onTabChange('tasks');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative p-2 hover:bg-accent rounded-full cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border text-foreground max-h-[400px] overflow-y-auto">
        {notifications.length === 0 && reminders.length === 0 ? (
          <DropdownMenuItem className="text-muted-foreground">No notifications or reminders</DropdownMenuItem>
        ) : (
          <>
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} onClick={() => handleNotificationClick(n)}>
                <div className={`text-sm py-1 ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                  {n.message}
                </div>
              </DropdownMenuItem>
            ))}
            {reminders.map(r => (
              <DropdownMenuItem key={r.id} onClick={() => handleReminderClick(r)}>
                <div className={`text-sm py-1 ${r.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                  <span className="text-primary font-bold mr-1">Reminder:</span> {r.message}
                </div>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-border mt-2 pt-2 px-2 pb-1">
              <button 
                onClick={() => onTabChange && onTabChange('notifications')}
                className="w-full text-center text-sm text-primary hover:text-primary py-2 rounded-md hover:bg-accent transition-colors"
              >
                View all notifications
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
