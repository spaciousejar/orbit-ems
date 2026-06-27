import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Info,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Notification, Reminder, UserProfile } from '../types';
import { notificationService } from '../services/notificationService';
import { reminderService } from '../services/reminderService';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  profile: UserProfile;
}

export function NotificationsDashboard({ profile }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const unsubNotifs = notificationService.subscribeToNotifications(profile.uid, setNotifications);
    const unsubReminders = reminderService.subscribeToReminders(profile.uid, setReminders);
    return () => {
      unsubNotifs();
      unsubReminders();
    };
  }, [profile.uid]);

  const handleMarkAllRead = async () => {
    try {
      await Promise.all([
        notificationService.markAllAsRead(profile.uid),
        reminderService.markAllAsRead(profile.uid)
      ]);
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all([
        notificationService.clearAll(profile.uid),
        reminderService.clearAll(profile.uid)
      ]);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await reminderService.deleteReminder(id);
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleMarkReadNotification = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkReadReminder = async (id: string) => {
    try {
      await reminderService.markAsRead(id);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const allItems = [
    ...notifications.map(n => ({ ...n, itemType: 'notification' as const })),
    ...reminders.map(r => ({ ...r, itemType: 'reminder' as const, createdAt: r.createdAt || new Date().toISOString() }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'unread' && item.read) return false;
    if (activeTab === 'read' && !item.read) return false;
    
    if (filterType !== 'all') {
      if (item.itemType === 'notification' && item.type !== filterType) return false;
      if (item.itemType === 'reminder' && item.type !== filterType) return false;
    }
    
    return true;
  });

  const getIcon = (item: any) => {
    if (item.itemType === 'reminder') {
        return item.type === 'task' ? <CheckSquare className="w-5 h-5 text-primary" /> : <Calendar className="w-5 h-5 text-brand-emerald" />;
    }
    switch (item.type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-brand-emerald" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getBgColor = (item: any) => {
    if (item.itemType === 'reminder') {
      return item.type === 'task' ? 'bg-primary/10 border-primary/20' : 'bg-emerald-500/10 border-emerald-500/20';
    }
    switch (item.type) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your latest alerts and reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleMarkAllRead}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border backdrop-blur-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-muted border border-border">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">All</TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-background">Unread</TabsTrigger>
                <TabsTrigger value="read" className="data-[state=active]:bg-background">Read</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-background border-border text-sm rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="task">Tasks</option>
                <option value="leave">Leaves</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filteredItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 text-center"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No notifications</h3>
                  <p className="text-muted-foreground">You're all caught up! Check back later.</p>
                </motion.div>
              ) : (
                filteredItems.map((item) => (
                  <motion.div
                    key={`${item.itemType}-${item.id}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 sm:p-6 flex flex-col sm:flex-row gap-4 transition-colors group relative",
                      !item.read ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    {!item.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    
                    <div className={cn("p-3 rounded-xl border shrink-0 w-fit h-fit", getBgColor(item))}>
                      {getIcon(item)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn(
                            "font-medium text-base",
                            !item.read ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {item.itemType === 'reminder' ? 'Reminder' : 'Notification'}
                          </h4>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted border-border text-muted-foreground">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {format(parseISO(item.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm mt-1",
                        !item.read ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.message}
                      </p>
                      
                      {item.itemType === 'reminder' && (item as Reminder).reminderTime && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-warning bg-warning/10 w-fit px-2.5 py-1 rounded-md border border-warning/20">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {format(parseISO((item as Reminder).reminderTime), 'MMM d, yyyy h:mm a')}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => item.itemType === 'notification' ? handleMarkReadNotification(item.id!) : handleMarkReadReminder(item.id!)}
                          className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => item.itemType === 'notification' ? handleDeleteNotification(item.id!) : handleDeleteReminder(item.id!)}
                        className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
