
import LandingHeader from '@/components/landing-header';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1>Refund Policy</h1>

          <p>
            <strong>Last Updated:</strong> July 26, 2024
          </p>

          <p>
            At focusinflow, we want you to be satisfied with your purchase. We
            offer a 14-day money-back guarantee on our Premium Subscription and
            Lifetime plans.
          </p>

          <h2>Premium Subscription (Monthly/Annually)</h2>
          <p>
            If you are not satisfied with our Premium Subscription, you are
            eligible for a full refund if you request it within 14 days of your
            initial purchase date. This applies to both monthly and annual subscription
            plans. Refunds are not provided for recurring subscription payments
            after the initial 14-day period.
          </p>

          <h2>Lifetime Plan (One-Time Purchase)</h2>
          <p>
            For our Lifetime plan, we offer a 14-day money-back guarantee. If
            you find that the Lifetime plan does not meet your needs, you can
            request a full refund within 14 days of your purchase date.
          </p>

          <h2>How to Request a Refund</h2>
          <p>
            To request a refund, please contact our support team at{' '}
            <a href="mailto:support@focusinflow.com">support@focusinflow.com</a>{' '}
            within the 14-day period. Please include your order number or the
            email address associated with your account in your request.
          </p>

          <h2>Processing Time</h2>
          <p>
            Refunds are typically processed within 5-10 business days. The
            refund will be issued to the original payment method used for the
            purchase.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our Refund Policy, please contact us:
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
