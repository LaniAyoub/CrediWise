/**
 * Shared form styling utilities for analyse step components
 * Ensures consistent look and feel across all input types
 */

export const formStyles = {
  // Input field base styles
  input: 'w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors',

  // Smaller compact input
  inputSmall: 'w-full px-2 py-1 text-sm border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors',

  // Textarea base styles
  textarea: 'w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-colors',

  // Select/dropdown
  select: 'w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors',

  // Form label
  label: 'block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wide',

  // Error message
  error: 'text-xs text-rose-500 dark:text-rose-400 mt-1',

  // Section card wrapper
  section: 'bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm',

  // Section header with icon
  sectionHeader: 'flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700/60',

  // Section title within header
  sectionTitle: 'text-sm font-semibold text-surface-900 dark:text-surface-50',

  // Section icon
  sectionIcon: 'w-5 h-5 text-surface-400 dark:text-surface-500 flex-shrink-0',

  // Section content area
  sectionContent: 'p-6 space-y-4',

  // Subsection divider
  subsectionDivider: 'border-t border-surface-200 dark:border-surface-700 pt-6 mt-6',

  // Inline help text
  helpText: 'text-xs text-surface-500 dark:text-surface-400 mt-1',

  // Badge for status
  badge: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
  badgeSuccess: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  badgeWarning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  badgeError: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  badgeInfo: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',

  // Grid layouts
  gridCols1: 'grid grid-cols-1 gap-4',
  gridCols2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  gridCols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  gridCols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',

  // Table styles
  table: 'w-full',
  tableHeader: 'bg-surface-50 dark:bg-surface-700/50',
  tableHeaderCell: 'text-left text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3',
  tableHeaderCellRight: 'text-right text-xs font-semibold text-surface-600 dark:text-surface-400 px-4 py-3',
  tableRow: 'border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors',
  tableCell: 'px-4 py-3',
  tableCellRight: 'px-4 py-3 text-right',
};

// Helper to combine classes
export const cn = (...classes: (string | undefined | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};
