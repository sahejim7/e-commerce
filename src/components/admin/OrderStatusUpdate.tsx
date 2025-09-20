"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/lib/actions/admin/orderActions";

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusUpdate({ orderId, currentStatus }: OrderStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = () => {
    if (selectedStatus === currentStatus) {
      toast.info("Status is already set to this value");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateOrderStatus(orderId, selectedStatus);
        
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to update order status");
        console.error("Error updating order status:", error);
      }
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleStatusUpdate}
        disabled={isPending || selectedStatus === currentStatus}
        size="sm"
      >
        {isPending ? "Updating..." : "Update Status"}
      </Button>
    </div>
  );
}
