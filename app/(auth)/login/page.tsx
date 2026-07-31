'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const { profile, error } = await db.login(email, password);
      
      if (error || !profile) {
        showToast(error || 'Login failed', 'error');
        return;
      }

      // Success
      showToast(`Welcome back, ${profile.name}!`, 'success');

      // Set cookies for middleware checks (mostly for mock mode)
      if (typeof document !== 'undefined') {
        document.cookie = `qevn_user_id=${profile.id}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `qevn_role=${profile.role}; path=/; max-age=86400; SameSite=Lax`;
      }

      // Update global Zustand state
      setUser(profile);

      // Routing
      router.push(profile.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      console.error(err);
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@qevn.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>



          <div className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Request Sign Up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
