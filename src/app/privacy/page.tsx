
import LandingHeader from '@/components/landing-header';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1>Privacy Policy for focusinflow</h1>

          <p>
            <strong>Last Updated:</strong> July 26, 2024
          </p>

          <h2>Introduction</h2>
          <p>
            Welcome to focusinflow. We are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our application.
          </p>
          <p>
            Please read this privacy policy carefully. If you do not agree with
            the terms of this privacy policy, please do not access the
            application.
          </p>

          <h2>Collection of Your Information</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect via the Application includes:
          </p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Personally identifiable
              information, such as your name, email address, that you
              voluntarily give to us when you register with the Application.
            </li>
            <li>
              <strong>Derivative Data:</strong> Information our servers
              automatically collect when you access the Application, such as your
              IP address, your browser type, your operating system, your access
              times, and the pages you have viewed directly before and after
              accessing the Application.
            </li>
          </ul>

          <h2>Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Application to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>
              Email you regarding your account or order.
            </li>
            <li>
              Monitor and analyze usage and trends to improve your experience
              with the Application.
            </li>
            <li>
              Notify you of updates to the Application.
            </li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at: <a href="mailto:support@focusinflow.com">support@focusinflow.com</a>
          </p>

          <div className="text-center mt-12">
            <Link href="/" className="text-primary hover:underline">
                &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
       <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; 2024 focusinflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
