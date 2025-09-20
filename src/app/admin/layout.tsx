import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import AdminSidebarWrapper from '@/components/admin/AdminSidebarWrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated and is an admin
  const user = await getCurrentUser();
  
  // If user is not authenticated, redirect to sign-in
  if (!user) {
    redirect('/sign-in');
  }
  
  // If user is authenticated but not an admin, redirect to sign-in
  if (!user.isAdmin) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen bg-background admin-retro">
      {/* Sidebar */}
      <AdminSidebarWrapper />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
