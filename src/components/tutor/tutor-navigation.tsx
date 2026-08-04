// src/components/tutor/tutor-navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Calendar,
  DollarSign,
  Settings,
  BookOpen,
  PencilLine,
  Globe,
  LogOut
} from 'lucide-react';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/tutor', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Sessions', 
    href: '/tutor/sessions', 
    icon: Video 
  },
  { 
    name: 'Schedule', 
    href: '/tutor/schedule', 
    icon: Calendar 
  },
  {
    name: 'Students',
    href: '/tutor/students',
    icon: Users
  },
  {
    name: 'Homework',
    href: '/tutor/homework',
    icon: PencilLine
  },
  { 
    name: 'Commissions', 
    href: '/tutor/commissions', 
    icon: DollarSign 
  },
  { 
    name: 'Content Library', 
    href: '/tutor/lessons', 
    icon: BookOpen 
  },
  {
    name: 'Public Profile',
    href: '/tutor/public-profile',
    icon: Globe
  },
  { 
    name: 'Settings', 
    href: '/tutor/settings', 
    icon: Settings 
  },
];

export function TutorNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}