"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteButtonProps {
  itemId: string;
  itemName: string;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  redirectPath?: string;
}

export function DeleteButton({ itemId, itemName, deleteAction, redirectPath }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAction(itemId);
      if (result.success) {
        toast.success(result.message || "Item deleted successfully!");
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-900 text-sm font-medium"
      title={`Delete ${itemName}`}
    >
      Delete
    </button>
  );
}

