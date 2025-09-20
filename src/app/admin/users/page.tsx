'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { getAdminUsers, toggleAdminStatus } from '@/lib/actions/admin/userActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth/actions';
import Link from 'next/link';

interface UsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

function AdminSwitch({ 
  userId, 
  isAdmin, 
  currentUserId, 
  onToggle 
}: { 
  userId: string; 
  isAdmin: boolean; 
  currentUserId: string;
  onToggle: (userId: string, newStatus: boolean) => Promise<void>;
}) {
  const isCurrentUser = userId === currentUserId;
  
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isAdmin}
        disabled={isCurrentUser}
        onCheckedChange={(checked) => onToggle(userId, checked)}
      />
      <span className="text-sm text-muted-foreground">
        {isAdmin ? 'Admin' : 'User'}
        {isCurrentUser && ' (You)'}
      </span>
    </div>
  );
}

function UsersTable({ 
  users, 
  totalPages, 
  currentPage, 
  currentUserId, 
  onToggleAdmin 
}: { 
  users: any[]; 
  totalPages: number; 
  currentPage: number;
  currentUserId: string;
  onToggleAdmin: (userId: string, newStatus: boolean) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <p className="text-sm text-muted-foreground">
          View and manage all registered users
        </p>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No users found</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {user.name || 'No name provided'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminSwitch 
                          userId={user.id}
                          isAdmin={user.isAdmin}
                          currentUserId={currentUserId}
                          onToggle={onToggleAdmin}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/users/${user.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex-1 flex justify-between sm:hidden">
                  {currentPage > 1 && (
                    <Button asChild variant="outline">
                      <a href={`/admin/users?page=${currentPage - 1}`}>
                        Previous
                      </a>
                    </Button>
                  )}
                  {currentPage < totalPages && (
                    <Button asChild variant="outline">
                      <a href={`/admin/users?page=${currentPage + 1}`}>
                        Next
                      </a>
                    </Button>
                  )}
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      {currentPage > 1 && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/admin/users?page=${currentPage - 1}`}>
                            Previous
                          </a>
                        </Button>
                      )}
                      {currentPage < totalPages && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/admin/users?page=${currentPage + 1}`}>
                            Next
                          </a>
                        </Button>
                      )}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="mt-2 h-4 bg-muted rounded w-1/2 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UsersContent({ searchParams }: UsersPageProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;

  // Load users and current user data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [currentUserData, usersData] = await Promise.all([
          getCurrentUser(),
          getAdminUsers(page, 20, search)
        ]);
        
        setCurrentUser(currentUserData);
        setUsers(usersData.users);
        setTotalCount(usersData.totalCount);
        setTotalPages(usersData.totalPages);
        setCurrentPage(usersData.currentPage);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [page, search]);

  const handleToggleAdmin = async (userId: string, newStatus: boolean) => {
    try {
      const result = await toggleAdminStatus(userId);
      
      if (result.success) {
        // Update the local state to reflect the change
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, isAdmin: newStatus } : user
          )
        );
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Error loading users
              </h3>
              <div className="mt-2 text-sm text-destructive">
                {error}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Authentication required
              </h3>
              <div className="mt-2 text-sm text-destructive">
                You must be logged in to access this page.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
            User Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} total user{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                name="search"
                id="search"
                placeholder="Search by name or email..."
                defaultValue={search}
              />
            </div>
            <Button type="submit">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <UsersTable 
        users={users} 
        totalPages={totalPages} 
        currentPage={currentPage}
        currentUserId={currentUser.id}
        onToggleAdmin={handleToggleAdmin}
      />
    </div>
  );
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <UsersContent searchParams={searchParams} />
    </div>
  );
}
