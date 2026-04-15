# CrediWise Modern Design System Implementation Guide

## Overview
This guide provides complete specifications for implementing the modern, professional design system across all CrediWise UI components and pages. All changes maintain existing logic, routing, forms, and i18n—only the visual layer is updated.

**Status**: Production-ready design specifications  
**Last Updated**: April 14, 2026  
**Framework**: React 19 + TailwindCSS 3+ + TypeScript

---

## Part 1: Design Tokens & Constants

### 1.1 Color Palette

```typescript
// Color Usage Guidelines
colors: {
  // Primary Brand (Blue)
  'brand-500': '#3381fc',    // Primary action
  'brand-600': '#2563eb',    // Hover state
  'brand-700': '#1d4ed8',    // Active state
  
  // Semantic Colors
  'emerald-500': '#10b981',  // Success
  'amber-500': '#f59e0b',    // Warning
  'rose-500': '#f43f5e',     // Danger/Error
  
  // Surface/Neutral Gray Scale (light mode)
  'surface-50':  '#f9fafb',
  'surface-100': '#f3f4f6',
  'surface-200': '#e5e7eb',
  'surface-300': '#d1d5db',
  'surface-400': '#9ca3af',
  'surface-500': '#6b7280',
  'surface-600': '#4b5563',
  'surface-700': '#374151',
  'surface-800': '#1f2937',
  'surface-900': '#111827',
  
  // Navy (dark mode background)
  'navy-950': '#0f172a',
}
```

### 1.2 Typography Scale

```typescript
// Font weights: Inter 400, 500, 600, 700
typography: {
  'page-title':      '32px / 1.25 font-700 tracking-tight',  // H1
  'section-header':  '20px / 1.3 font-600',                   // H2
  'subsection':      '16px / 1.4 font-600',                   // H3
  'body':            '14px / 1.5 font-400',                   // Paragraph
  'label':           '12px / 1.5 font-500 uppercase',         // Labels
  'caption':         '12px / 1.5 font-400',                   // Secondary
  'xs':              '11px / 1.5 font-400',                   // Tiny
}
```

### 1.3 Spacing (8px Grid)

```typescript
spacing: {
  '0':    '0px',
  '1':    '4px',   // 0.5 unit
  '2':    '8px',   // 1 unit  (base)
  '3':    '12px',  // 1.5 units
  '4':    '16px',  // 2 units
  '6':    '24px',  // 3 units
  '8':    '32px',  // 4 units
  '12':   '48px',  // 6 units
}
// Use: p-4 (16px), mb-6 (24px), gap-4 (16px), etc.
```

### 1.4 Border Radius

```typescript
borders: {
  'rounded-lg':   '8px',   // Buttons, inputs, small cards
  'rounded-xl':   '12px',  // Cards, modals
  'rounded-full': '9999px' // Pills, full circles
}
```

### 1.5 Shadows & Elevation

```typescript
shadows: {
  'shadow-none':  'none',
  'shadow-sm':    '0 1px 2px 0 rgba(0,0,0,0.05)',
  'shadow-md':    '0 4px 6px -1px rgba(0,0,0,0.1)',
  'shadow-lg':    '0 10px 15px -3px rgba(0,0,0,0.1)',
  'shadow-xl':    '0 20px 25px -5px rgba(0,0,0,0.1)',
  'shadow-2xl':   '0 25px 50px -12px rgba(0,0,0,0.25)',
}
// Usage: shadow-sm on cards, shadow-md on hover, shadow-lg on modals
```

### 1.6 Transitions

```typescript
transitions: {
  'duration-150': '150ms',  // Fast: buttons, inputs, small elements
  'duration-200': '200ms',  // Standard: larger animations, modals
  'ease-out':     'cubic-bezier(0.4, 0, 1, 1)',
}
// Apply: transition-smooth (includes all three)
```

---

## Part 2: Component Specifications

### 2.1 Badge Component

```typescript
// File: src/components/ui/Badge.tsx

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

// Implementation Pattern:
const Badge = ({ children, variant = 'neutral', size = 'sm' }: BadgeProps) => {
  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    info:    'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
    neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 font-500',       // 12px
    md: 'text-sm px-3 py-1.5 font-500',       // 14px
  };

  return (
    <span
      className={`inline-flex items-center rounded-md whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

// Usage:
// <Badge variant="success" size="sm">Approved</Badge>
// <Badge variant="danger" size="md">Rejected</Badge>
```

### 2.2 Status Badge Variants

```typescript
// For table status columns, use semantic styling:

const statusStyles = {
  'Pending':   'bg-amber-100 text-amber-700',
  'Approved':  'bg-emerald-100 text-emerald-700',
  'Rejected':  'bg-rose-100 text-rose-700',
  'Processing': 'bg-brand-100 text-brand-700',
};

// In JSX:
<span className={`status-badge ${statusStyles[status]}`}>
  {status}
</span>
```

### 2.3 Modal Component

```typescript
// File: src/components/ui/Modal.tsx

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Key styling principles:
// - Backdrop: dark/40 opacity (surface-950/40)
// - Card: white/surface-800 bg, rounded-xl (12px), border-surface-200/700
// - Shadow: shadow-xl on card
// - Animations: fade-in (backdrop), slide-up (card)

// Example implementation:
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop with blur */}
  <div
    className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm animate-fade-in"
    onClick={onClose}
  />

  {/* Modal Card */}
  <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-lg border border-surface-200 dark:border-surface-700 animate-slide-up">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
      <h3 className="text-section-header">{title}</h3>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-smooth"
      >
        {/* Close icon */}
      </button>
    </div>

    {/* Body */}
    <div className="px-6 py-6 overflow-y-auto">
      {children}
    </div>
  </div>
</div>
```

### 2.4 Table Component

```typescript
// File: src/components/ui/Table.tsx

// Key specifications:
// - Header row: bg-surface-50 dark:bg-surface-800
// - Row dividers: border-surface-200 dark:border-surface-700 (1px)
// - Row height: min-h-12 (48px)
// - Hover state: bg-surface-50 dark:bg-surface-700/50
// - Headers: text-label (12px, 500, uppercase)

<table className="w-full divide-y divide-surface-200 dark:divide-surface-700">
  <thead className="bg-surface-50 dark:bg-surface-800">
    <tr>
      {headers.map(header => (
        <th key={header} className="text-label px-4 py-3 text-left">
          {header}
        </th>
      ))}
    </tr>
  </thead>
  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
    {rows.map(row => (
      <tr
        key={row.id}
        className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-smooth"
      >
        {/* cells */}
      </tr>
    ))}
  </tbody>
</table>

// Empty State:
<div className="text-center py-12">
  <svg className="mx-auto h-12 w-12 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {/* Empty icon */}
  </svg>
  <p className="text-caption mt-2">No data found</p>
  <button className="mt-4">Create New</button>
</div>

// Skeleton Loader:
<div className="animate-shimmer h-12 rounded-lg bg-surface-200 dark:bg-surface-700" />
```

### 2.5 Card Component (Stat Cards)

```typescript
// File: src/components/ui/Card.tsx

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'brand' | 'emerald' | 'amber' | 'rose';
}

// Implementation:
<div className="card-interactive bg-white dark:bg-surface-800 p-6 border-l-4 border-{color}-500">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-label">{title}</p>
      <p className="text-2xl font-700 text-surface-900 dark:text-surface-50 mt-1">
        {value}
      </p>
      {subtitle && <p className="text-caption mt-1">{subtitle}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs font-600 ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        </div>
      )}
    </div>
    <div className="p-3 rounded-xl bg-{color}-50 dark:bg-{color}-900/20 text-{color}-600 dark:text-{color}-400">
      {icon}
    </div>
  </div>
</div>

// Color mapping:
const colorMap = {
  'brand':   { bg: 'bg-brand-50', icon: 'text-brand-600', dark: 'dark:bg-brand-900/20 dark:text-brand-400' },
  'emerald': { bg: 'bg-emerald-50', icon: 'text-emerald-600', dark: 'dark:bg-emerald-900/20 dark:text-emerald-400' },
  // ... etc
};
```

---

## Part 3: Page & Layout Components

### 3.1 Sidebar Component

```typescript
// File: src/components/common/Sidebar.tsx

// Specifications:
// - Width: 240px (lg:w-60), collapsible to 64px (lg:w-16) icon mode
// - Background: navy-950 (dark)
// - Active item: brand-500 left border + brand-50/10 background
// - Sections with dividers: border-surface-700
// - Icons: w-6 h-6 in collapsed mode
// - Labels: hidden when collapsed

<aside className="hidden lg:flex flex-col w-60 bg-navy-950 text-surface-50 border-r border-surface-800 transition-smooth">
  {/* Logo */}
  <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-800">
    {/* Logo */}
  </div>

  {/* Navigation Groups */}
  <nav className="flex-1 overflow-y-auto py-4 space-y-1">
    {sections.map(section => (
      <div key={section.id}>
        <p className="text-label px-6 py-2 text-surface-500">{section.title}</p>
        {section.items.map(item => (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-500 transition-smooth ${
              isActive(item.href)
                ? 'border-l-4 border-brand-500 bg-brand-50/10 text-brand-200'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    ))}
  </nav>

  {/* Footer User Card */}
  <div className="border-t border-surface-800 p-4">
    {/* User info */}
  </div>
</aside>

// Mobile: Collapses to tab bar at bottom
<nav className="tab-bar-responsive lg:hidden">
  {/* Bottom nav items */}
</nav>
```

### 3.2 Header Component

```typescript
// File: src/components/common/Header.tsx

// Specifications:
// - Height: 64px (h-16)
// - Background: surface-900 light / navy-950 dark
// - Sticky top with backdrop blur
// - Left: breadcrumbs (hide on mobile < md)
// - Right: language switcher, user dropdown

<header className="sticky top-0 z-30 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 backdrop-blur-sm">
  <div className="flex items-center justify-between h-16 px-4 lg:px-6">
    {/* Left: Menu button (mobile) + Breadcrumbs */}
    <div className="flex items-center gap-4">
      <button className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800">
        {/* Menu icon */}
      </button>
      <nav className="hidden md:flex items-center gap-2 text-sm text-surface-500">
        {/* Breadcrumbs */}
      </nav>
    </div>

    {/* Right: Language Switcher + User Dropdown */}
    <div className="flex items-center gap-4">
      <LanguageSwitcher />
      <UserDropdown />
    </div>
  </div>
</header>
```

### 3.3 Main Layout

```typescript
// File: src/components/layout/MainLayout.tsx

<div className="flex h-screen bg-surface-50 dark:bg-surface-900">
  {/* Sidebar */}
  <Sidebar />

  {/* Main Content */}
  <div className="flex flex-col flex-1 overflow-hidden main-content-responsive">
    {/* Header */}
    <Header />

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8">
        {children}
      </div>
    </main>

    {/* Footer */}
    <Footer />
  </div>

  {/* Mobile Tab Bar */}
  <TabBar />
</div>
```

---

## Part 4: Page Component Patterns

### 4.1 Page Header Pattern

```typescript
// Standard page header with title, subtitle, and action button

<div className="mb-8">
  <h1 className="text-page-title">{title}</h1>
  <p className="text-caption mt-1">{description}</p>
</div>

{/* Stats Row (on dashboard) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  {stats.map(stat => (
    <Card key={stat.id} {...stat} />
  ))}
</div>

{/* Search + Filters Row */}
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <SearchBar placeholder="Search..." />
  <FilterDropdown />
</div>

{/* Content (Table/List) */}
<Table {...tableProps} />
```

### 4.2 Form Pattern

```typescript
// Grouped form sections with clear visual hierarchy

<form className="space-y-8">
  {/* Section 1: Personal Information */}
  <div className="card-base p-6">
    <h3 className="text-section-header mb-1">Personal Information</h3>
    <p className="text-caption mb-6">Update your profile details</p>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Input label="First Name" {...register('firstName')} />
      <Input label="Last Name" {...register('lastName')} />
      <Input label="Email" type="email" {...register('email')} />
      <Input label="Phone" {...register('phone')} />
    </div>
  </div>

  {/* Section 2: Address */}
  <div className="card-base p-6">
    <h3 className="text-section-header mb-1">Address</h3>
    <p className="text-caption mb-6">Where should we send correspondence?</p>
    
    <div className="space-y-6">
      <Input label="Street Address" {...register('street')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Input label="City" {...register('city')} />
        <Input label="State" {...register('state')} />
        <Input label="Postal Code" {...register('postal')} />
      </div>
    </div>
  </div>

  {/* Actions */}
  <div className="flex justify-end gap-3">
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button variant="primary" type="submit">Save Changes</Button>
  </div>
</form>
```

---

## Part 5: Responsive Design Patterns

### 5.1 Mobile-First Breakpoints

```typescript
// Use Tailwind's mobile-first approach:

// Mobile (default, <640px)
<div className="grid grid-cols-1 gap-4 p-4">
  {/* Single column */}
</div>

// Tablet (sm:, ≥640px)
<div className="sm:grid-cols-2">
  {/* Two columns */}
</div>

// Laptop (md:, ≥768px)
<div className="md:grid-cols-3 md:p-6">
  {/* Three columns, larger padding */}
</div>

// Desktop (lg:, ≥1024px)
<div className="lg:grid-cols-4 lg:p-8">
  {/* Four columns */}
</div>
```

### 5.2 Responsive Table Pattern

```typescript
// Tables convert to cards on mobile

{/* Desktop: Table */}
<div className="hidden md:block">
  <Table {...props} />
</div>

{/* Mobile: Card List */}
<div className="md:hidden space-y-4">
  {data.map(item => (
    <div key={item.id} className="card-base p-4 space-y-2">
      <div className="flex justify-between items-start">
        <h4 className="font-600">{item.name}</h4>
        <Badge variant={item.status.variant}>{item.status.label}</Badge>
      </div>
      <p className="text-caption">{item.description}</p>
      <div className="pt-4 border-t border-surface-200 dark:border-surface-700 flex gap-2">
        <Button size="sm" variant="secondary">Edit</Button>
        <Button size="sm" variant="ghost">Delete</Button>
      </div>
    </div>
  ))}
</div>
```

---

## Part 6: Dark Mode Implementation

### 6.1 CSS Variables Approach

```css
/* Already in globals.css */
html.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
}
```

### 6.2 Component Dark Mode Pattern

```typescript
// Use Tailwind's dark: variant
<div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50">
  {/* Content automatically adapts */}
</div>

// For complex styling:
<div className={`
  bg-surface-50 dark:bg-surface-900
  text-surface-700 dark:text-surface-300
  border-surface-200 dark:border-surface-800
  shadow-sm dark:shadow-md
  transition-smooth
`}>
  {/* All states covered */}
</div>
```

### 6.3 Dark Mode Toggle

```typescript
// In header or settings
const toggleDarkMode = () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};

// On app load
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}, []);
```

---

## Part 7: Accessibility & WCAG AA Compliance

### 7.1 Color Contrast Ratios

```typescript
// All text must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text)

// Verified combinations:
✅ surface-900 on white       (21:1 - excellent)
✅ surface-700 on white       (6.9:1 - good)
✅ surface-600 on white       (5.4:1 - good)
✅ white on brand-600         (7:1 - good)
✅ white on rose-600          (5.8:1 - good)
✅ surface-400 on white       (3.3:1 - WCAG AAA only, use for secondary text)

// Test with: WebAIM Contrast Checker
```

### 7.2 Focus Indicators

```typescript
// All interactive elements must have visible focus indicators

// Use focus-ring class:
className="focus-ring"  // 2px ring with offset

// Or manual:
className="focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"

// For dark mode:
className="focus:ring-brand-500 focus:ring-offset-0 dark:focus:ring-offset-surface-900"
```

### 7.3 ARIA Attributes

```typescript
// Form validation
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
<p id={`${id}-error`} role="alert">{error}</p>

// Icons
<svg aria-hidden="true">...</svg>  // Decorative
<svg aria-label="Download">...</svg>  // Interactive

// Live regions
<div role="alert" aria-live="polite">
  Changes saved successfully
</div>

// Semantic HTML
<button>Not <div onClick={...}>  // Always use button for actions
<a href="...">Not <div onClick={...}>  // Always use a for links
```

### 7.4 Keyboard Navigation

```typescript
// Ensure all interactive elements are reachable via Tab key

// Test:
1. Navigate with Tab/Shift+Tab
2. Activate with Enter/Space
3. Close modals with Escape
4. Arrow keys for navigation (dropdowns, menus)

// Implementation:
<div
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
>
  {/* content */}
</div>
```

---

## Part 8: Animation & Transition Patterns

### 8.1 Page Transitions

```typescript
// Add fade-in animation on route change

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
  {children}
</motion.div>

// Or CSS:
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 8.2 Modal Animations

```typescript
// Modal + Backdrop animations are already configured

<div className="animate-fade-in">  {/* Backdrop */}
  <div className="animate-slide-up">  {/* Modal */}
    {/* content */}
  </div>
</div>
```

### 8.3 Skeleton Loaders

```typescript
// Use shimmer animation for loading states

<div className="animate-shimmer h-12 rounded-lg" />

// Or more complex skeleton:
<div className="space-y-4">
  <div className="animate-shimmer h-6 w-3/4 rounded-lg" />
  <div className="animate-shimmer h-4 w-1/2 rounded-lg" />
  <div className="animate-shimmer h-32 rounded-lg" />
</div>
```

---

## Part 9: Implementation Checklist

### Components to Update
- [x] Button.tsx - DONE
- [x] Input.tsx - DONE
- [ ] Badge.tsx
- [ ] Modal.tsx
- [ ] Table.tsx
- [ ] Card.tsx
- [ ] ConfirmDialog.tsx
- [ ] SearchBar.tsx
- [ ] LoadingSkeleton.tsx

### Layouts to Update
- [ ] MainLayout.tsx
- [ ] AuthLayout.tsx
- [ ] Sidebar.tsx
- [ ] Header.tsx
- [ ] Footer.tsx

### Pages to Update
- [ ] LoginPage.tsx
- [ ] DashboardPage.tsx
- [ ] ClientsPage.tsx
- [ ] DemandesPage.tsx
- [ ] AgencesPage.tsx
- [ ] GestionnairesPage.tsx
- [ ] ProfilePage.tsx

### Global Styles
- [x] globals.css - DONE (typography, shadows, utilities)

### Dark Mode
- [ ] Test all components in dark mode
- [ ] Verify contrast ratios in dark mode
- [ ] Test theme toggle functionality

### Accessibility
- [ ] Run WCAG AA audit
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify focus indicators

### Responsive Design
- [ ] Test on mobile (<640px)
- [ ] Test on tablet (640-1024px)
- [ ] Test on desktop (>1024px)
- [ ] Test tables/lists conversion on mobile

---

## Part 10: Quick Reference

### Common Class Combinations

```typescript
// Card with interactive state
className="card-interactive p-6"

// Form section
className="card-base p-6 space-y-6"

// Page title
className="text-page-title mb-2"

// Label + value pair
className="text-label mb-1 block"
className="text-body font-600"

// Status badge
className="status-badge bg-emerald-100 text-emerald-700"

// Input wrapper
className="mb-6"

// Button group
className="flex gap-3 justify-end"

// Empty state
className="text-center py-12 space-y-4"
```

### Import Pattern

```typescript
// At top of component files:
import { useTranslation } from 'react-i18next';  // i18n
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
// ... other imports

// In component:
const { t } = useTranslation('namespace');
// Use t('key') for all user-facing text
```

---

## Final Notes

1. **Maintain i18n**: All user-facing text uses `t('key')` - never hardcode text
2. **Keep Logic**: Only change visual layer - forms, routing, validation unchanged
3. **TypeScript**: Maintain strict typing - all components fully typed
4. **Testing**: Test responsive design, dark mode, keyboard navigation, color contrast
5. **Performance**: Use CSS-based animations, minimize re-renders, optimize images

For questions or clarifications, refer to the design tokens in Part 1 and test against the WCAG AA standards in Part 7.

---

**Version 1.0 - April 14, 2026**  
*CrediWise Modern Design System*
