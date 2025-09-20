'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '🖥️',
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: '👕',
  },
  {
    name: 'Attributes',
    href: '/admin/attributes',
    icon: '🔧',
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: '📋',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: '👤',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r-2 border-foreground/20 min-h-screen p-6 retro-card">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">E-commerce Management</p>
      </div>
      
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3 retro-button",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Link href={item.href}>
                <span className="text-lg mr-3">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
