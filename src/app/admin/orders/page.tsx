import { Suspense } from 'react';
import Link from 'next/link';
import { getAdminOrders } from '@/lib/actions/admin/orderActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteOrderDialog } from '@/components/admin/DeleteOrderDialog';
import { formatPrice } from '@/lib/utils/price';

interface OrdersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
  };
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusVariants = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'default',
    delivered: 'default',
    cancelled: 'destructive',
  } as const;

  return (
    <Badge variant={statusVariants[status as keyof typeof statusVariants] || 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function OrdersTable({ orders, totalPages, currentPage }: { 
  orders: any[]; 
  totalPages: number; 
  currentPage: number; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage and view all customer orders
        </p>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No orders found</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Button asChild variant="link" className="p-0 h-auto">
                          <Link href={`/admin/orders/${order.id}`}>
                            #{order.orderNumber}
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {order.customerName || 'Guest'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {formatPrice(order.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/orders/${order.id}`}>
                              View
                            </Link>
                          </Button>
                          <DeleteOrderDialog 
                            orderId={order.id} 
                            orderNumber={order.orderNumber}
                            variant="destructive"
                            size="sm"
                          />
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
                      <Link href={`/admin/orders?page=${currentPage - 1}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {currentPage < totalPages && (
                    <Button asChild variant="outline">
                      <Link href={`/admin/orders?page=${currentPage + 1}`}>
                        Next
                      </Link>
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
                          <Link href={`/admin/orders?page=${currentPage - 1}`}>
                            Previous
                          </Link>
                        </Button>
                      )}
                      {currentPage < totalPages && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/orders?page=${currentPage + 1}`}>
                            Next
                          </Link>
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
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function OrdersContent({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const search = resolvedSearchParams.search;
  const status = resolvedSearchParams.status;

  try {
    const { orders, totalCount, totalPages, currentPage } = await getAdminOrders(
      page,
      20,
      search,
      status
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Order Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} total order{totalCount !== 1 ? 's' : ''}
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
                  placeholder="Search by order ID, customer name, or email..."
                  defaultValue={search}
                />
              </div>
              <div>
                <Select name="status" defaultValue={status || 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">
                Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <OrdersTable orders={orders} totalPages={totalPages} currentPage={currentPage} />
      </div>
    );
  } catch (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                Error loading orders
              </h3>
              <div className="mt-2 text-sm text-destructive">
                There was an error loading the orders. Please try again.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
