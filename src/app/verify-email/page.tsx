
"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleVerifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const actionCode = searchParams.get('oobCode');

    if (!actionCode) {
      setError("Invalid verification link. The required code is missing.");
      setStatus('error');
      return;
    }

    const verify = async () => {
      const verificationError = await handleVerifyEmail(actionCode);
      if (verificationError) {
        setError(verificationError);
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 5000); // Redirect after 5 seconds
      }
    };

    verify();
  }, [searchParams, handleVerifyEmail, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          {status === 'loading' && 'We are verifying your email address...'}
          {status === 'success' && 'Your email has been successfully verified!'}
          {status === 'error' && 'There was a problem verifying your email.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        )}
        {status === 'success' && (
          <Alert className="mb-4 border-green-500 text-green-700 dark:border-green-500/50 dark:text-green-400 [&>svg]:text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
                Your email is verified. You can now log in. You will be redirected shortly.
            </AlertDescription>
          </Alert>
        )}
        {status === 'error' && (
           <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>
                {error || 'An unknown error occurred.'}
            </AlertDescription>
          </Alert>
        )}
        <Button asChild variant="outline">
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}


export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-background">
      <div className="text-center relative mb-8">
        <Link
          href="/"
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          focusinflow
        </Link>
      </div>
      <Suspense fallback={<Card className="w-full max-w-md p-8 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto" /></Card>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}

