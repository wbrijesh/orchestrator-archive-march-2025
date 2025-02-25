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

export function RegisterForm({ className, ...props }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.register(formData);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Registration failed');
      }
      
      router.push('/auth/login');
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
            <h1 className="text-xl font-bold">Create your account</h1>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
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
              Create Account
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
