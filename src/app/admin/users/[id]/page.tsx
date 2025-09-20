'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { getAdminUserDetails, getAdminUserOrders, getAdminUserAddresses } from '@/lib/actions/admin/userDetailsActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Calendar, Shield, MapPin, Package, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils/price';

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserInfoCard({ user }: { user: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Email</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Name</div>
            <div className="text-sm text-muted-foreground">
              {user.name || 'No name provided'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Role</div>
            <Badge variant={user.isAdmin ? "default" : "secondary"}>
              {user.isAdmin ? 'Admin' : 'User'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Joined</div>
            <div className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="h-4 w-4 text-muted-foreground flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div>
            <div className="text-sm font-medium">Email Verified</div>
            <div className="text-sm text-muted-foreground">
              {user.emailVerified ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderHistoryCard({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No orders found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Order History ({orders.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <Badge variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'shipped' ? 'secondary' :
                    order.status === 'paid' ? 'outline' :
                    order.status === 'pending' ? 'destructive' : 'secondary'
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                </div>
                <div className="font-medium">
                  {formatPrice(typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount || 0))}
                </div>
              </div>
              
              {order.items.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-medium">Items:</div>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {item.productName} ({item.variantSku}) - Qty: {item.quantity} - {formatPrice(typeof item.priceAtPurchase === 'number' ? item.priceAtPurchase : parseFloat(item.priceAtPurchase || 0))}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddressesCard({ addresses }: { addresses: any[] }) {
  if (addresses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Saved Addresses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No saved addresses
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Saved Addresses ({addresses.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={address.type === 'billing' ? 'default' : 'secondary'}>
                    {address.type === 'billing' ? 'Billing' : 'Shipping'}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
              </div>
              
              <div className="text-sm space-y-1">
                <div>{address.line1}</div>
                {address.line2 && <div>{address.line2}</div>}
                <div>{address.city}, {address.state} {address.postalCode}</div>
                <div>{address.country}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UserDetailsContent({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const [userData, ordersData, addressesData] = await Promise.all([
          getAdminUserDetails(userId),
          getAdminUserOrders(userId),
          getAdminUserAddresses(userId)
        ]);
        
        if (!userData) {
          setError('User not found');
          return;
        }
        
        setUser(userData);
        setOrders(ordersData);
        setAddresses(addressesData);
        setError(null);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [userId]);

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
                Error loading user
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

  if (!user) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                User not found
              </h3>
              <div className="mt-2 text-sm text-destructive">
                The requested user could not be found.
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
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
            {user.name || 'User Details'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      {/* User Information and Addresses */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserInfoCard user={user} />
        <AddressesCard addresses={addresses} />
      </div>

      {/* Order History */}
      <OrderHistoryCard orders={orders} />
    </div>
  );
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Resolve params in useEffect for client components
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  if (!resolvedParams) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <UserDetailsContent userId={resolvedParams.id} />
      </Suspense>
    </div>
  );
}
