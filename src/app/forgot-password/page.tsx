
import { Suspense } from 'react';
import Link from 'next/link';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
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
      <Suspense fallback={<div>Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
