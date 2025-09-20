"use client";

import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function UserMenu() {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated && user) {
    return (
      <Link 
        href="/account" 
        className="p-2 text-gray-900 hover:text-gray-600 transition-colors"
        title="My Account"
      >
        <User className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <Link 
      href="/sign-in" 
      className="p-2 text-gray-900 hover:text-gray-600 transition-colors"
      title="Sign In"
    >
      <LogIn className="w-6 h-6" />
    </Link>
  );
}
