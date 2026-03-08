
import LandingHeader from '@/components/landing-header';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1>Terms of Service for focusinflow</h1>

          <p>
            <strong>Last Updated:</strong> July 26, 2024
          </p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By using our application, focusinflow, you agree to be bound by
            these Terms of Service. If you do not agree to these Terms, do not
            use the application.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            focusinflow provides users with tools to manage tasks, track time
            using the Pomodoro technique, and gain insights into their
            productivity. This includes features both free and under a premium
            subscription.
          </p>
          
          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us with
            information that is accurate, complete, and current at all times.
            Failure to do so constitutes a breach of the Terms, which may result
            in immediate termination of your account on our Service.
          </p>

          <h2>4. Subscriptions</h2>
          <p>
            Some parts of the Service are billed on a subscription basis. You
            will be billed in advance on a recurring and periodic basis (such as
            monthly or annually), depending on the type of subscription plan you
            select when purchasing the subscription.
          </p>

          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall focusinflow, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from your access to or use of
            or inability to access or use the Service.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <a href="mailto:support@focusinflow.com">support@focusinflow.com</a>
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
