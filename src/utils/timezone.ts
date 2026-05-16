import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export function getCurrentTimeInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

export function getTodayDateString(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

export function getCurrentHHMM(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'HH:mm');
}

export function isWithinWindow(currentHHMM: string, targetHHMM: string, windowMinutes: number): boolean {
  const [currentH, currentM] = currentHHMM.split(':').map(Number);
  const [targetH, targetM] = targetHHMM.split(':').map(Number);

  const currentMinutes = currentH * 60 + currentM;
  const targetMinutes = targetH * 60 + targetM;

  const diff = Math.abs(currentMinutes - targetMinutes);
  return diff <= windowMinutes;
}

export function getReminderTimes(template: string, customTimes?: string[]): string[] {
  switch (template) {
    case 'gentle':
      return ['09:00', '19:00'];
    case 'moderate':
      return ['09:00', '12:00', '17:00', '21:00'];
    case 'aggressive':
      return ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    case 'custom':
      return customTimes || [];
    default:
      return ['09:00', '19:00'];
  }
}
