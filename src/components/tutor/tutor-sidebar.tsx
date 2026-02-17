// src/components/tutor/tutor-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Video, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface TutorSidebarProps {
  navigation: NavigationItem[];
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  tutorPlan?: string | null;
}

export function TutorSidebar({ 
  navigation, 
  userName, 
  userEmail, 
  avatarUrl,
  tutorPlan 
}: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === '/tutor') {
      return pathname === '/tutor';
    }
    return pathname?.startsWith(href);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="w-64 border-r border-border bg-card flex flex-col">
      {/* Navigation Links */}
      <div className="p-4 space-y-1 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${active 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              {item.name}
              {item.name === 'Commissions' && (
                <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          Quick Actions
        </p>
        <Link
          href="/tutor/sessions"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Video className="w-4 h-4" />
          Start Session
        </Link>
      </div>

      {/* User Menu */}
      <div className="border-t border-border p-4 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {tutorPlan || 'Basic'} Plan
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg py-2 z-20">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              
              <Link
                href="/tutor/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Settings
              </Link>
              
              <Link
                href="/dashboard"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Switch to Student View
              </Link>
              
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}