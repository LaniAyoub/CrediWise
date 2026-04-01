import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return '—';
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  } catch {
    return '—';
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '—';
  }
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};
