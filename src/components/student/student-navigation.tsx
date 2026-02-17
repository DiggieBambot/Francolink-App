// src/components/student/student-navigation.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing'; // Use next-intl's Link
import { 
  Home, 
  BookOpen, 
  Trophy,
  Video,
  Settings,
  Target,
  Brain,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

const navigationItems: NavItem[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: Home },
  { labelKey: 'learn', href: '/learn', icon: BookOpen },
  { labelKey: 'practice', href: '/student/practice', icon: Target },
  { labelKey: 'sessions', href: '/student/sessions', icon: Video },
  { labelKey: 'leaderboard', href: '/student/leaderboard', icon: Trophy },
  { labelKey: 'placement_test', href: '/placement-test', icon: Brain },
  { labelKey: 'settings', href: '/settings', icon: Settings },
];

export function StudentNavigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('student_nav');

  const isActive = (href: string): boolean => {
    // Remove locale prefix from pathname for comparison
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    if (href === '/dashboard') {
      return pathWithoutLocale === '/dashboard' || pathname === '/dashboard';
    }
    
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${active 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}