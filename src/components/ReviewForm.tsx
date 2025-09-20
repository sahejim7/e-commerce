"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { createReview } from "@/lib/actions/product";
import { getCurrentUser } from "@/lib/auth/actions";

interface ReviewFormProps {
  productId: string;
  onReviewAdded: () => void;
}

export default function ReviewForm({ productId, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated, setUser } = useAuthStore();

  // Try to refresh auth state when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      const refreshAuthState = async () => {
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name || "Unknown User",
              image: currentUser.image || undefined,
            });
          }
        } catch (error) {
          console.error("Failed to refresh auth state:", error);
        }
      };
      refreshAuthState();
    }
  }, [isAuthenticated, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createReview(productId, user.id, rating, comment.trim() || undefined);
      
      if (result.success) {
        toast.success("Review submitted successfully!");
        setRating(0);
        setComment("");
        onReviewAdded();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-light-300 bg-light-100 p-6 text-center">
        <p className="text-body text-dark-700 mb-4">Please sign in to leave a review</p>
        <a 
          href="/sign-in" 
          className="inline-block rounded-lg border-2 border-dark-900 bg-dark-900 px-6 py-3 text-body-medium font-medium text-light-100 transition-all duration-200 hover:bg-light-100 hover:text-dark-900"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-body-medium text-dark-900 mb-2">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-light-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-body text-dark-700">
            {rating > 0 && `${rating} star${rating > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-body-medium text-dark-900 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          className="w-full rounded-lg border border-light-300 px-4 py-3 text-body text-dark-900 placeholder:text-dark-500 focus:border-dark-500 focus:outline-none focus:ring-2 focus:ring-[--color-dark-500] resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="mt-1 text-caption text-dark-500">
          {comment.length}/500 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-lg border-2 border-dark-900 bg-dark-900 px-6 py-3 text-body-medium font-medium text-light-100 transition-all duration-200 hover:bg-light-100 hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:bg-light-300 disabled:text-dark-500 disabled:border-light-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
