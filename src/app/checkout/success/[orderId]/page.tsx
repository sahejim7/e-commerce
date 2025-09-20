import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowLeft, ShoppingBag, Package, Truck, Home } from "lucide-react";
import { getOrderById } from "@/lib/actions/checkoutActions";
import { formatPrice } from "@/lib/utils/price";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OrderSuccessPageProps {
  params: {
    orderId: string;
  };
}

function OrderItem({ item }: { item: any }) {
  return (
    <div className="flex gap-4 py-4 border-b border-light-300 last:border-b-0">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-light-200">
        {item.variant.product.imageUrl ? (
          <Image
            src={item.variant.product.imageUrl}
            alt={item.variant.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-body-medium text-dark-900 truncate">
          {item.variant.product.name}
        </h4>
        <p className="text-caption text-dark-700">SKU: {item.variant.sku}</p>
        
        {/* Display selected attributes */}
        {item.variant.attributes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {item.variant.attributes.map((attr: any, index: number) => (
              <span key={index} className="text-caption text-dark-600">
                {attr.displayName}: {attr.value}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <span className="text-body text-dark-700">
            Quantity: {item.quantity}
          </span>
          <span className="text-body-medium text-dark-900">
            {formatPrice(parseFloat(item.priceAtPurchase) * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

function OrderDetails({ order }: { order: any }) {
  const subtotal = order.items.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.priceAtPurchase) * item.quantity), 0
  );
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Order Items */}
      <div>
        <Card className="p-6">
          <h3 className="text-heading-4 text-dark-900 mb-4">Order Items</h3>
          <div className="space-y-0">
            {order.items.map((item: any) => (
              <OrderItem key={item.id} item={item} />
            ))}
          </div>
        </Card>
      </div>

      {/* Order Summary */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-heading-4 text-dark-900 mb-4">Order Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-body text-dark-700">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-body text-dark-700">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-body text-dark-700">
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            
            <div className="border-t border-light-300 pt-3">
              <div className="flex justify-between text-body-medium text-dark-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-heading-4 text-dark-900 mb-4">Shipping Address</h3>
          <div className="text-body text-dark-700 space-y-1">
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p>{order.shippingAddress.line2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Package,
          text: 'Order Confirmed',
          description: 'Your order has been received and is being processed.',
          color: 'text-blue-600'
        };
      case 'paid':
        return {
          icon: CheckCircle,
          text: 'Payment Confirmed',
          description: 'Your payment has been processed successfully.',
          color: 'text-green-600'
        };
      case 'shipped':
        return {
          icon: Truck,
          text: 'Shipped',
          description: 'Your order is on its way to you.',
          color: 'text-purple-600'
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          text: 'Delivered',
          description: 'Your order has been delivered successfully.',
          color: 'text-green-600'
        };
      default:
        return {
          icon: Package,
          text: 'Processing',
          description: 'Your order is being processed.',
          color: 'text-blue-600'
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const Icon = statusInfo.icon;

  return (
    <div className="flex items-center gap-3 p-4 bg-light-100 rounded-lg">
      <Icon className={`h-6 w-6 ${statusInfo.color}`} />
      <div>
        <p className={`text-body-medium font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </p>
        <p className="text-caption text-dark-700">
          {statusInfo.description}
        </p>
      </div>
    </div>
  );
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </nav>

      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-heading-2 text-dark-900 mb-4">
          Thank you for your order!
        </h1>
        
        <p className="text-body text-dark-700 mb-6 max-w-2xl mx-auto">
          Your order has been successfully placed. We've sent you a confirmation email with all the details.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Order Information */}
      <div className="mb-8">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-heading-3 text-dark-900 mb-2">Order #{order.id.slice(-8)}</h2>
              <p className="text-body text-dark-700">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <OrderStatus status={order.status} />
          </div>
          
          <div className="border-t border-light-300 pt-6">
            <OrderDetails order={order} />
          </div>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="text-center">
        <Card className="p-6">
          <h3 className="text-heading-4 text-dark-900 mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h4 className="text-body-medium text-dark-900 mb-2">Order Processing</h4>
              <p className="text-caption text-dark-700">
                We'll prepare your order for shipment within 1-2 business days.
              </p>
            </div>
            
            <div>
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h4 className="text-body-medium text-dark-900 mb-2">Shipping</h4>
              <p className="text-caption text-dark-700">
                You'll receive a tracking number once your order ships.
              </p>
            </div>
            
            <div>
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h4 className="text-body-medium text-dark-900 mb-2">Delivery</h4>
              <p className="text-caption text-dark-700">
                Your order will arrive within 3-5 business days.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
