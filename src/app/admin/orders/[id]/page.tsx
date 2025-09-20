import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminOrderDetails } from '@/lib/actions/admin/orderActions';
import { OrderStatusUpdate } from '@/components/admin/OrderStatusUpdate';
import { DeleteOrderDialog } from '@/components/admin/DeleteOrderDialog';
import { formatPrice } from '@/lib/utils/price';

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AddressCard({ 
  title, 
  address 
}: { 
  title: string; 
  address: any; 
}) {
  if (!address) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
          <p className="text-sm text-gray-500">No address provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-sm text-gray-700">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>{address.city}, {address.state} {address.postalCode}</p>
          <p>{address.country}</p>
        </div>
      </div>
    </div>
  );
}

function OrderItemsTable({ items }: { items: any[] }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Order Items</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Products included in this order
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.variant.product.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {Object.entries(item.variant.attributes).length > 0 ? (
                      Object.entries(item.variant.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' / ')
                    ) : (
                      'No attributes specified'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.variant.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(typeof item.priceAtPurchase === 'string' ? parseFloat(item.priceAtPurchase) : item.priceAtPurchase)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatPrice((typeof item.priceAtPurchase === 'string' ? parseFloat(item.priceAtPurchase) : item.priceAtPurchase) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                Order Total:
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatPrice(items.length > 0 ? items.reduce((sum, item) => {
                  const price = typeof item.priceAtPurchase === 'string' ? parseFloat(item.priceAtPurchase) : item.priceAtPurchase;
                  return sum + (price * item.quantity);
                }, 0) : 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        
        {/* Order summary skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function OrderDetailsContent({ orderId }: { orderId: string }) {
  try {
    const orderDetails = await getAdminOrderDetails(orderId);

    if (!orderDetails) {
      notFound();
    }

    const { order, items } = orderDetails;
    const orderNumber = order.id.slice(-8).toUpperCase();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/admin/orders" className="text-gray-400 hover:text-gray-500">
                    Orders
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">
                      Order #{orderNumber}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Order #{orderNumber}
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <div className="flex items-center space-x-4">
              <OrderStatusBadge status={order.status || 'pending'} />
              <OrderStatusUpdate 
                orderId={order.id} 
                currentStatus={order.status || 'pending'} 
              />
              <DeleteOrderDialog 
                orderId={order.id} 
                orderNumber={orderNumber}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Order Summary</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{order.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <OrderStatusBadge status={order.status || 'pending'} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">
                  {formatPrice(typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items - Takes up 2/3 of the width */}
          <div className="lg:col-span-2">
            <OrderItemsTable items={items} />
          </div>

          {/* Customer Info and Addresses - Takes up 1/3 of the width */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Customer Information</h3>
                {order.user ? (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{order.user?.name || 'No name provided'}</p>
                    <p className="text-gray-500">{order.user?.email || 'No email provided'}</p>
                    <p className="text-gray-500 mt-2">
                      Customer since {order.user?.createdAt ? new Date(order.user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Guest order</p>
                )}
              </div>
            </div>

            {/* Addresses */}
            <AddressCard title="Shipping Address" address={order.shippingAddress} />
            <AddressCard title="Billing Address" address={order.billingAddress} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading order details
              </h3>
              <div className="mt-2 text-sm text-red-700">
                There was an error loading the order details. Please try again.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <OrderDetailsContent orderId={id} />
      </Suspense>
    </div>
  );
}
