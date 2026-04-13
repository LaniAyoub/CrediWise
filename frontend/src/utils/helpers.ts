/**
 * Extracts a meaningful error message from an API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
};

/**
 * Creates initials from a name
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const f = firstName?.charAt(0) || '';
  const l = lastName?.charAt(0) || '';
  return (f + l).toUpperCase() || '?';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Classnames helper — joins truthy class strings
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
