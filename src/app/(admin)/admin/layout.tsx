import { DollarSign, AppWindow } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, FileText, Plug, ChevronRight, Bot, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Panel | FrancoLink',
  description: 'Admin dashboard for FrancoLink',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'ADMIN') redirect('/admin/login');

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Pricing', href: '/admin/pricing', icon: DollarSign },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Integrations', href: '/admin/integrations', icon: Plug },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'AI Settings', href: '/admin/settings/ai', icon: Bot },
    { name: 'App Settings', href: '/admin/app-settings', icon: AppWindow },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">FrancoLink</span>
          </div>
          <div className="ml-auto">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to App</Link>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <nav className="w-64 border-r bg-card">
          <div className="space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  <Icon className="w-4 h-4" />{item.name}
                </Link>
              );
            })}
          </div>
          <div className="border-t mx-4 mt-4 pt-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuration</p>
            <div className="mt-2 space-y-1">
              <Link href="/admin/content/upload" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                <FileText className="w-4 h-4" /> Upload Content
              </Link>
              <Link href="/admin/content/drafts" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                <FileText className="w-4 h-4" /> Content Drafts
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
