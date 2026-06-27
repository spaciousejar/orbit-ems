import { useEffect } from 'react';
import { holidayService } from '../../services/holidayService';
import { auth } from '../../firebase';
import { userService } from '../../services/userService';

const commonHolidays = [
  { name: "New Year's Day", date: "2026-01-01", type: "Public" as const, description: "Start of the year" },
  { name: "Martin Luther King Jr. Day", date: "2026-01-19", type: "Public" as const, description: "MLK Day" },
  { name: "Presidents' Day", date: "2026-02-16", type: "Public" as const, description: "Presidents' Day" },
  { name: "Memorial Day", date: "2026-05-25", type: "Public" as const, description: "Memorial Day" },
  { name: "Good Friday", date: "2026-04-03", type: "Public" as const, description: "Good Friday" },
  { name: "Juneteenth", date: "2026-06-19", type: "Public" as const, description: "Juneteenth" },
  { name: "Independence Day", date: "2026-07-04", type: "Public" as const, description: "Independence Day" },
  { name: "Labor Day", date: "2026-09-07", type: "Public" as const, description: "Labor Day" },
  { name: "Columbus Day", date: "2026-10-12", type: "Public" as const, description: "Columbus Day" },
  { name: "Halloween", date: "2026-10-31", type: "Public" as const, description: "Halloween" },
  { name: "Veterans Day", date: "2026-11-11", type: "Public" as const, description: "Veterans Day" },
  { name: "Thanksgiving Day", date: "2026-11-26", type: "Public" as const, description: "Thanksgiving Day" },
  { name: "Christmas Eve", date: "2026-12-24", type: "Public" as const, description: "Christmas Eve" },
  { name: "Christmas Day", date: "2026-12-25", type: "Public" as const, description: "Christmas Day" },
  { name: "New Year's Eve", date: "2026-12-31", type: "Public" as const, description: "New Year's Eve" },
];

export const HolidayInitializer = () => {
  useEffect(() => {
    const addHolidays = async () => {
      let isUserAdmin = false;
      if (auth.currentUser?.email) {
        const userRecord = await userService.getUserByEmail(auth.currentUser.email);
        isUserAdmin = userRecord?.role === 'admin' || auth.currentUser.email === (import.meta.env.VITE_ADMIN_EMAIL || '');
      }
      if (!isUserAdmin) return;

      const existing = await holidayService.getAllHolidays();
      const existingKeyed = new Set(existing.map(h => `${h.date}|${h.name}`));

      const toAdd = commonHolidays.filter(h => !existingKeyed.has(`${h.date}|${h.name}`));

      if (toAdd.length === 0) return;

      for (const holiday of toAdd) {
        try {
          await holidayService.addHoliday({
            ...holiday,
            createdBy: auth.currentUser?.uid || 'system',
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`Error adding holiday ${holiday.name}:`, error);
        }
      }
    };
    addHolidays();
  }, []);

  return null;
};
