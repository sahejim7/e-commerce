"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteOrder } from '@/lib/actions/admin/orderActions';
import { Trash2 } from 'lucide-react';

interface DeleteOrderDialogProps {
  orderId: string;
  orderNumber: string;
  variant?: 'default' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function DeleteOrderDialog({ 
  orderId, 
  orderNumber, 
  variant = 'destructive',
  size = 'default',
  children 
}: DeleteOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOrder(orderId);
      
      if (result.success) {
        setOpen(false);
        router.push('/admin/orders');
        router.refresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant} size={size}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Order #{orderNumber}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this order? This action cannot be undone.
            All order items and associated data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
