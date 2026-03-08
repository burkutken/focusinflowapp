// app/reset-password/page.tsx

import { Suspense } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-background">
      <div className="text-center relative mb-8">
        <Link href="/" className="text-2xl font-bold text-foreground">
          focusinflow
        </Link>
      </div>
      <Suspense fallback={<div>Loading password reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}