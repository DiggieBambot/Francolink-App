import { DollarSign, AppWindow } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, FileText, Plug, ChevronRight, Bot, Shield, GraduationCap, TrendingUp, LifeBuoy, MessageSquare, Newspaper, Megaphone, History, Globe, PencilLine, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Panel | FrancoLink',
  description: 'Admin dashboard for FrancoLink',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = (userData?.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'COMMUNITY_MANAGER') redirect('/admin/login');
  const isCM = role === 'COMMUNITY_MANAGER';

  // Community managers get a scoped nav: outreach + support + moderation only.
  const navigation = isCM
    ? [
        { name: 'My Outreach', href: '/admin/outreach', icon: Megaphone },
        { name: 'Support', href: '/admin/support', icon: LifeBuoy },
        { name: 'Moderation', href: '/admin/moderation', icon: MessageSquare },
      ]
    : [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Growth', href: '/admin/growth', icon: TrendingUp },
        { name: 'Outreach', href: '/admin/outreach', icon: Megaphone },
        { name: 'Support', href: '/admin/support', icon: LifeBuoy },
        { name: 'Moderation', href: '/admin/moderation', icon: MessageSquare },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Tutors', href: '/admin/tutors', icon: GraduationCap },
        { name: 'Content', href: '/admin/content', icon: FileText },
        { name: 'Tutor Lessons', href: '/admin/tutor-lessons', icon: GraduationCap },
        { name: 'Lesson Worker', href: '/admin/lesson-worker', icon: Wrench },
        { name: 'Homework', href: '/admin/homework', icon: PencilLine },
        { name: 'Daily News', href: '/admin/daily-news', icon: Newspaper },
        { name: 'Import from Drive', href: '/admin/import-from-drive', icon: FileText },
        { name: 'Payments', href: '/admin/payments', icon: CreditCard },
        { name: 'Pricing', href: '/admin/pricing', icon: DollarSign },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Lesson Coverage', href: '/admin/coverage', icon: History },
        { name: 'Website', href: '/admin/website', icon: Globe },
        { name: 'Integrations', href: '/admin/integrations', icon: Plug },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'AI Settings', href: '/admin/settings/ai', icon: Bot },
        { name: 'App Settings', href: '/admin/app-settings', icon: AppWindow },
      ];

  // Every navigable destination, in one list, so the sidebar and the mobile
  // strip below can never drift apart.
  const configLinks = isCM
    ? []
    : [
        { href: "/admin/content/upload", name: "Upload Content", icon: FileText },
        { href: "/admin/content/drafts", name: "Content Drafts", icon: FileText },
      ];

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* viewport-fit=cover is set app-wide, so in a standalone PWA this
          header sits UNDER the status bar and the Dynamic Island unless it
          pays the inset. env() is 0 in a normal tab. */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-bold sm:text-lg">Admin</span>
          </Link>
          {/* The breadcrumb is the first thing to go on a narrow screen: it
              names the site you are already on. */}
          <span className="hidden items-center gap-2 sm:flex">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">FrancoLink</span>
          </span>
          <Link
            href="/dashboard"
            className="ml-auto shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to App
          </Link>
        </div>

        {/* Below lg the sidebar becomes a scrolling strip. A 256px rail on a
            430px phone left the content 174px wide, which is why the stat
            cards were clipped mid-word — and a drawer would need client state
            in what is otherwise a server component. */}
        <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden">
          {[...navigation, ...configLinks].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex lg:h-[calc(100dvh-4rem)]">
        <nav className="hidden w-64 shrink-0 overflow-y-auto border-r bg-card lg:block">
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
          {configLinks.length > 0 && (
          <div className="border-t mx-4 mt-4 pt-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuration</p>
            <div className="mt-2 space-y-1">
              {configLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    <Icon className="w-4 h-4" /> {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          )}
        </nav>
        <main className="min-w-0 flex-1 lg:overflow-y-auto">
          {/* `container` alone has fixed max-widths and no small-screen
              padding of its own; px-4 keeps the cards off the edges. */}
          <div
            className="container min-w-0 px-4 py-6 sm:px-6 lg:px-8"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
