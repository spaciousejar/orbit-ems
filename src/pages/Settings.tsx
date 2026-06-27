import { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  Save,
  Shield,
  Clock,
  Calendar,
  Upload,
  Palette
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile, CompanySettings, UserSettings } from '../types';
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface SettingsProps {
  profile: UserProfile;
}

export function Settings({ profile }: SettingsProps) {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [company, user] = await Promise.all([
          settingsService.getCompanySettings(),
          settingsService.getUserSettings(profile.uid)
        ]);

        if (company) setCompanySettings(company);
        else {
          // Default company settings
          const defaultCompany: CompanySettings = {
            name: 'Orbit EMS',
            workingHours: { start: '09:00', end: '18:00' },
            leavePolicies: { annualLimit: 20, sickLimit: 10 },
            updatedAt: new Date().toISOString()
          };
          setCompanySettings(defaultCompany);
        }

        if (user) setUserSettings(user);
        else {
          // Default user settings
          const defaultUser: UserSettings = {
            uid: profile.uid,
            theme: 'dark',
            notifications: {
              email: true,
              push: true,
              leaveUpdates: true,
              taskAssignments: true
            },
            updatedAt: new Date().toISOString()
          };
          setUserSettings(defaultUser);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.uid]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error('File size exceeds 800KB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-photos/${profile.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await userService.updateUser(profile.uid, { photoURL });
      toast.success('Profile photo updated');
      window.location.reload(); // Refresh to update profile photo
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUserSettings = async () => {
    if (!userSettings) return;
    setSaving(true);
    try {
      await settingsService.updateUserSettings(profile.uid, {
        ...userSettings,
        theme: theme as 'light' | 'dark' | 'system'
      });
      toast.success('User settings saved');
    } catch (error) {
      toast.error('Failed to save user settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompanySettings = async () => {
    if (!companySettings) return;
    setSaving(true);
    try {
      await settingsService.updateCompanySettings(companySettings);
      toast.success('Company settings saved');
    } catch (error) {
      toast.error('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  const isAdmin = profile.role === 'admin' || profile.role === 'hr_manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile, preferences, and organization settings.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-background">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="company" className="data-[state=active]:bg-background">
              <Building2 className="h-4 w-4 mr-2" />
              Organization
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Profile Information</CardTitle>
                  <CardDescription>Update your personal details and how others see you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                      />
                      <Button 
                        variant="outline" 
                        className="border-border text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Change Photo'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                      <Input 
                        id="name" 
                        value={profile.name} 
                        disabled 
                        className="bg-background border-border text-muted-foreground"
                      />
                      <p className="text-[10px] text-muted-foreground italic">Name is managed via Google Account</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                      <Input 
                        id="email" 
                        value={profile.email || ''} 
                        disabled 
                        className="bg-background border-border text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-muted-foreground">Role</Label>
                      <div className="flex items-center gap-2 p-2 bg-background border border-border rounded-md text-muted-foreground">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="capitalize">{profile.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex flex-col gap-2 h-24"
                    >
                      <Sun className="h-6 w-6" />
                      Light
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex flex-col gap-2 h-24"
                    >
                      <Moon className="h-6 w-6" />
                      Dark
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex flex-col gap-2 h-24"
                    >
                      <Monitor className="h-6 w-6" />
                      System
                    </Button>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveUserSettings} 
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Appearance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified about updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userSettings && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-foreground">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive updates via your registered email.</p>
                        </div>
                        <Switch 
                          checked={userSettings.notifications.email}
                          onCheckedChange={(checked) => setUserSettings({
                            ...userSettings,
                            notifications: { ...userSettings.notifications, email: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-foreground">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive real-time browser notifications.</p>
                        </div>
                        <Switch 
                          checked={userSettings.notifications.push}
                          onCheckedChange={(checked) => setUserSettings({
                            ...userSettings,
                            notifications: { ...userSettings.notifications, push: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-foreground">Leave Updates</Label>
                          <p className="text-xs text-muted-foreground">Get notified when your leave requests are approved or rejected.</p>
                        </div>
                        <Switch 
                          checked={userSettings.notifications.leaveUpdates}
                          onCheckedChange={(checked) => setUserSettings({
                            ...userSettings,
                            notifications: { ...userSettings.notifications, leaveUpdates: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-foreground">Task Assignments</Label>
                          <p className="text-xs text-muted-foreground">Get notified when a new task is assigned to you.</p>
                        </div>
                        <Switch 
                          checked={userSettings.notifications.taskAssignments}
                          onCheckedChange={(checked) => setUserSettings({
                            ...userSettings,
                            notifications: { ...userSettings.notifications, taskAssignments: checked }
                          })}
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveUserSettings} 
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {isAdmin && companySettings && (
            <TabsContent value="company">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Company Profile</CardTitle>
                      <CardDescription>Basic information about your organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-muted-foreground">Organization Name</Label>
                        <Input 
                          id="companyName" 
                          value={companySettings.name}
                          onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-muted-foreground">Contact Email</Label>
                        <Input 
                          id="contactEmail" 
                          value={companySettings.contactEmail || ''}
                          onChange={(e) => setCompanySettings({ ...companySettings, contactEmail: e.target.value })}
                          className="bg-muted border-border text-foreground"
                          placeholder="hr@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-muted-foreground">Office Address</Label>
                        <Input 
                          id="address" 
                          value={companySettings.address || ''}
                          onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">Policies & Hours</CardTitle>
                      <CardDescription>Configure working hours and leave limits.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Work Start
                          </Label>
                          <Input 
                            type="time"
                            value={companySettings.workingHours.start}
                            onChange={(e) => setCompanySettings({
                              ...companySettings,
                              workingHours: { ...companySettings.workingHours, start: e.target.value }
                            })}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Work End
                          </Label>
                          <Input 
                            type="time"
                            value={companySettings.workingHours.end}
                            onChange={(e) => setCompanySettings({
                              ...companySettings,
                              workingHours: { ...companySettings.workingHours, end: e.target.value }
                            })}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Annual Leave
                          </Label>
                          <Input 
                            type="number"
                            value={companySettings.leavePolicies.annualLimit}
                            onChange={(e) => setCompanySettings({
                              ...companySettings,
                              leavePolicies: { ...companySettings.leavePolicies, annualLimit: parseInt(e.target.value) }
                            })}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Sick Leave
                          </Label>
                          <Input 
                            type="number"
                            value={companySettings.leavePolicies.sickLimit}
                            onChange={(e) => setCompanySettings({
                              ...companySettings,
                              leavePolicies: { ...companySettings.leavePolicies, sickLimit: parseInt(e.target.value) }
                            })}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleSaveCompanySettings} 
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Organization Settings
                  </Button>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
