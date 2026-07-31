'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email/resend';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        // Supabase Signup Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: 'employee',
              phone
            }
          }
        });

        if (error) {
          showToast(error.message, 'error');
          return;
        }

        if (data.user) {
          showToast('Account requested successfully! Please verify your email.', 'success');
          
          // Trigger welcome email asynchronously
          await sendEmail({
            to: email,
            subject: 'Welcome to QEVN CRM',
            html: emailTemplates.welcome(name).html,
            employeeId: data.user.id,
            template: 'Welcome Email'
          });

          router.push('/login');
        }
      } else {
        // Mock Signup Flow
        const profile = await db.createProfile(name, email, phone, 'employee');
        if (!profile) {
          showToast('User already exists with this email', 'error');
          return;
        }

        showToast('Account created successfully! Log in to get started.', 'success');

        // Mock welcome email
        await sendEmail({
          to: email,
          subject: 'Welcome to QEVN CRM',
          html: emailTemplates.welcome(name).html,
          employeeId: profile.id,
          template: 'Welcome Email'
        });

        router.push('/login');
      }
    } catch (err: any) {
      console.error(err);
      showToast('An unexpected error occurred during signup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join QEVN CRM and start managing your pipeline</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          <Input
            label="Full Name *"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="name@qevn.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password *</label>
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
            Create Account
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
