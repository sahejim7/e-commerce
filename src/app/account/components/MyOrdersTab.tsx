import { getUserOrders } from "@/lib/actions/userActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/price";
import Link from "next/link";
// import { format } from "date-fns";

export default async function MyOrdersTab() {
  const orders = await getUserOrders();

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You haven't placed any orders yet.</p>
        <Link 
          href="/products" 
          className="inline-block mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.orderId}>
              <TableCell className="font-medium">
                #{order.orderId.slice(-8).toUpperCase()}
              </TableCell>
              <TableCell>
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell>
                {formatPrice(parseFloat(order.totalAmount))}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    order.status === 'completed' ? 'default' : 
                    order.status === 'processing' ? 'secondary' : 
                    order.status === 'shipped' ? 'outline' : 'destructive'
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Link 
                  href={`/checkout/success/${order.orderId}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Details
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
