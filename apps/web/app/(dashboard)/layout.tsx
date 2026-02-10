'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-th-border border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-surface-secondary flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-transition">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
