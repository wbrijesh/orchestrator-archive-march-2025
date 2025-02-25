'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from '@/lib/api';

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(formData);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Login failed');
      }
      
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <GalleryVerticalEnd className="size-6 text-primary-foreground" />
              </div>
              <span className="sr-only">Orchestrator</span>
            </div>
            <h1 className="text-xl font-bold">Welcome to Orchestrator</h1>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive border border-destructive/50 px-4 py-3 rounded-md" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a>{" "}
        and{" "}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
