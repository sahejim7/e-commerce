"use client";

import { useState } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { getCurrentUser } from "@/lib/auth/actions";
type Props = {
  mode: "sign-in" | "sign-up";
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; userId?: string; error?: string }>;
};

export default function AuthForm({ mode, onSubmit }: Props) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await onSubmit(formData);

      if (result?.ok) {
        console.log('Auth success:', result.userId);
        
        // Update client-side auth state
        try {
          const user = await getCurrentUser();
          if (user) {
            setUser({
              id: user.id,
              email: user.email,
              name: user.name || "Unknown User",
              image: user.image || undefined,
            });
          }
        } catch (error) {
          console.error("Failed to sync auth state:", error);
        }
        
        router.push("/");
      } else {
        setError(result?.error || "Invalid email or password. Please try again.");
      }
    } catch (e) {
      console.log("Auth error:", e);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold text-black">
          {mode === "sign-in" ? "Welcome Back!" : "Join SECRETLACE!"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {mode === "sign-in"
            ? "Sign in to continue your journey"
            : "Create your account to start your style journey"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "sign-up" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-black">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-black">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="johndoe@gmail.com"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-black">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                placeholder="minimum 8 characters"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all pr-12"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-black"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {isLoading ? "Loading..." : (mode === "sign-in" ? "Sign In" : "Sign Up")}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
              <Link 
                href={mode === "sign-in" ? "/sign-up" : "/sign-in"} 
                className="text-black font-medium underline hover:no-underline"
              >
                {mode === "sign-in" ? "Sign Up" : "Sign In"}
              </Link>
            </p>
          </div>

          {mode === "sign-up" && (
            <p className="text-center text-xs text-gray-600">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-black underline hover:no-underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/delivery" className="text-black underline hover:no-underline">
                Delivery & Return Policy
              </Link>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
