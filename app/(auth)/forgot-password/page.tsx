'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email/resend';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}`;
      
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
        });

        if (error) {
          showToast(error.message, 'error');
          return;
        }

        showToast('Password reset link has been sent to your email', 'success');
      } else {
        // Mock Flow
        showToast('Password reset link generated in developer logs!', 'success');
        
        await sendEmail({
          to: email,
          subject: 'Reset your QEVN password',
          html: emailTemplates.passwordReset(resetLink).html,
          employeeId: 'mock_user',
          template: 'Password Reset Email'
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to request password reset', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your email address to receive a recovery link</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleResetRequest}>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Recovery Link
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
