'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';
import { logAuth } from '@/lib/auth/auth-guard';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser, hasHydrated } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect away from auth page to dashboard
  useEffect(() => {
    if (hasHydrated && user) {
      logAuth('User already authenticated. Redirecting away from /login to dashboard.');
      const dest = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      if (typeof window !== 'undefined') {
        window.location.replace(dest);
      } else {
        router.replace(dest);
      }
    }
  }, [user, hasHydrated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      logAuth(`Attempting login for email: ${email}`);
      const { profile, error } = await db.login(email, password);
      
      if (error || !profile) {
        logAuth(`Login failed for ${email}: ${error}`);
        showToast(error || 'Login failed', 'error');
        return;
      }

      logAuth(`Login success for ${email} (${profile.role})`);
      showToast(`Welcome back, ${profile.name}!`, 'success');

      // Set cookies for middleware checks
      if (typeof document !== 'undefined') {
        const domain = window.location.hostname;
        const cookieOptions = `; path=/; max-age=86400; SameSite=Lax`;
        
        document.cookie = `qevn_user_id=${profile.id}${cookieOptions}`;
        document.cookie = `qevn_role=${profile.role}${cookieOptions}`;
        document.cookie = `qevn_user_id=${profile.id}${cookieOptions}; domain=${domain}`;
        document.cookie = `qevn_role=${profile.role}${cookieOptions}; domain=${domain}`;

        if (domain.includes('.')) {
          const parentDomain = '.' + domain.split('.').slice(-2).join('.');
          document.cookie = `qevn_user_id=${profile.id}${cookieOptions}; domain=${parentDomain}`;
          document.cookie = `qevn_role=${profile.role}${cookieOptions}; domain=${parentDomain}`;
        }
      }

      setUser(profile);

      const targetDashboard = profile.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      if (typeof window !== 'undefined') {
        window.location.replace(targetDashboard);
      } else {
        router.push(targetDashboard);
      }
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
