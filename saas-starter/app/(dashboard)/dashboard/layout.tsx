'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  LayoutGrid,
  Link2,
  ListOrdered,
  ClipboardCheck,
  Database,
  CreditCard,
  Bike
} from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function isNavActive(href: string) {
    if (href === '/dashboard/hub/tenants') {
      return pathname.startsWith('/dashboard/hub/tenants');
    }
    if (href === '/dashboard/hub/roadmap') {
      return pathname.startsWith('/dashboard/hub/roadmap');
    }
    if (href === '/dashboard/hub/audit') {
      return pathname.startsWith('/dashboard/hub/audit');
    }
    if (href === '/dashboard/hub/data') {
      return pathname.startsWith('/dashboard/hub/data');
    }
    if (href === '/dashboard/hub/payments') {
      return pathname.startsWith('/dashboard/hub/payments');
    }
    if (href === '/dashboard/hub/riders') {
      return pathname.startsWith('/dashboard/hub/riders');
    }
    if (href === '/dashboard/marketplace') {
      return pathname.startsWith('/dashboard/marketplace');
    }
    if (href === '/dashboard/rides/book') {
      return pathname.startsWith('/dashboard/rides/book');
    }
    if (href === '/dashboard/rides/rider') {
      return pathname.startsWith('/dashboard/rides/rider');
    }
    if (href === '/dashboard/hub') {
      return (
        pathname.startsWith('/dashboard/hub') &&
        !pathname.startsWith('/dashboard/hub/tenants') &&
        !pathname.startsWith('/dashboard/hub/roadmap') &&
        !pathname.startsWith('/dashboard/hub/audit') &&
        !pathname.startsWith('/dashboard/hub/data') &&
        !pathname.startsWith('/dashboard/hub/payments') &&
        !pathname.startsWith('/dashboard/hub/riders')
      );
    }
    return pathname === href;
  }

  const navItems = [
    { href: '/dashboard/hub', icon: LayoutGrid, label: 'Integration hub' },
    { href: '/dashboard/hub/roadmap', icon: ListOrdered, label: 'Plan roadmap' },
    { href: '/dashboard/hub/audit', icon: ClipboardCheck, label: 'Repo audit' },
    { href: '/dashboard/hub/data', icon: Database, label: 'Domain data' },
    { href: '/dashboard/hub/riders', icon: Bike, label: 'Rider verification' },
    { href: '/dashboard/hub/payments', icon: CreditCard, label: 'Hub payments' },
    { href: '/dashboard/hub/tenants', icon: Link2, label: 'Tenant mappings' },
    { href: '/dashboard', icon: Users, label: 'Organization' },
    { href: '/dashboard/marketplace', icon: Users, label: 'Marketplace' },
    { href: '/dashboard/rides/book', icon: Bike, label: 'Book ride' },
    { href: '/dashboard/rides/rider', icon: Bike, label: 'Rider console' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Settings</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={isNavActive(item.href) ? 'secondary' : 'ghost'}
                  className={`shadow-none my-1 w-full justify-start ${
                    isNavActive(item.href) ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
