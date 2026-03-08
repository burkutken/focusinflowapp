
"use client";

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gem, Loader2, AlertTriangle, Star, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const PADDLE_CLIENT_TOKEN = 'test_2383a206916ac6c463e771ba70f';
const PADDLE_PRICE_IDS = {
  monthly: 'pri_01k4z4s5xxdgfaq5ff3530j0j5', // $1.99
  annual: 'pri_01k4z4x7c8g7j1a5x0y1q2w3e4', // $19.00
  lifetime: 'pri_01k4z50jzhyswpcb9ghk2zvn5z', // $9.99
};

export default function PaymentsPage() {
  const { user, loading, isPremium, isLifetime, forceTokenRefresh } = useAuth();
  const [paddle, setPaddle] = useState<any>(null);
  const [isPaddleLoading, setIsPaddleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (isPremium || isLifetime)) {
      router.push('/tasks');
    }
  }, [isPremium, isLifetime, loading, router]);
  
  const handlePaddleLoad = () => {
    try {
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: function (data: any) {
          if (data.name === 'checkout.completed') {
            console.log('Checkout completed, refreshing token...');
            toast({
              title: "Payment Successful!",
              description: "Your account has been upgraded. Refreshing your status...",
            });
            forceTokenRefresh().then(() => {
              console.log("Token refresh complete, redirecting.");
              router.push('/tasks');
            });
          }
          if (data.name === 'checkout.error') {
             toast({
              title: "Payment Error",
              description: "An error occurred during checkout. Please try again.",
              variant: "destructive",
            });
          }
        }
      });
      // After successful initialization, the window.Paddle object is the instance.
      setPaddle(window.Paddle);
      setIsPaddleLoading(false);
    } catch (err: any) {
        console.error("Paddle initialization failed:", err);
        setError("Failed to initialize the payment system.");
        setIsPaddleLoading(false);
    }
  };

  useEffect(() => {
    // Check if the Paddle script is already available
    if (typeof window.Paddle !== 'undefined') {
      handlePaddleLoad();
      return;
    }

    // If not, set up an interval to check for it
    const interval = setInterval(() => {
      if (typeof window.Paddle !== 'undefined') {
        clearInterval(interval);
        handlePaddleLoad();
      }
    }, 100); // Check every 100ms

    // Set a timeout to prevent infinite loops
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (typeof window.Paddle === 'undefined') {
        setError("Payment system failed to load. Please check your network or ad-blocker and refresh the page.");
        setIsPaddleLoading(false);
      }
    }, 10000); // 10-second timeout

    // Cleanup on component unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleCheckout = (priceId: string) => {
    if (!paddle || !user || !priceId || isPaddleLoading) {
      toast({
        title: "Checkout Error",
        description: "Payment system is not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    paddle.Checkout.open({
      items: [{
        priceId: priceId,
        quantity: 1
      }],
      email: user.email || undefined,
      customData: {
        userId: user.uid,
      }
    });
  }
  
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  const subscriptionPriceId = isAnnual ? PADDLE_PRICE_IDS.annual : PADDLE_PRICE_IDS.monthly;

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header onShowProfile={() => router.push('/tasks')} />
        <main className="flex-grow flex items-center justify-center p-4 md:p-8">
            {error ? (
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="w-full max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold font-headline">Choose Your Plan</h1>
                        <p className="text-muted-foreground mt-2">Unlock powerful new features and boost your productivity.</p>
                    </div>
                     {isPaddleLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            <Card className="flex flex-col border-primary">
                                <CardHeader className="text-center">
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        <Gem className="w-10 h-10 text-primary" />
                                    </div>
                                    <CardTitle className="text-3xl">Premium</CardTitle>
                                    <CardDescription>Become a productivity superhero with an AI coach.</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <div className="text-4xl font-bold mb-4">
                                        {isAnnual ? '$1.59' : '$1.99'}
                                        <span className="text-sm font-normal text-muted-foreground">/ month</span>
                                    </div>
                                    <div className="inline-flex items-center justify-center space-x-2 my-4">
                                        <Label htmlFor="billing-cycle">Monthly</Label>
                                        <Switch id="billing-cycle" checked={isAnnual} onCheckedChange={setIsAnnual} />
                                        <Label htmlFor="billing-cycle">Annually</Label>
                                        <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                                    </div>
                                    <ul className="space-y-2 text-left text-muted-foreground">
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Unlimited Tasks</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Managed AI (No key needed)</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Advanced Statistics & Insights</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Website tracking & blocking</li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-col gap-2">
                                    <Button size="lg" className="w-full" onClick={() => handleCheckout(subscriptionPriceId)} disabled={isPaddleLoading}>
                                        {isPaddleLoading ? <Loader2 className="animate-spin" /> : 'Go Premium'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Recurring payment. Cancel anytime.
                                    </p>
                                </CardFooter>
                            </Card>

                            <Card className="flex flex-col">
                                <CardHeader className="text-center">
                                    <div className="mx-auto bg-secondary/10 p-4 rounded-full w-fit mb-4">
                                        <Star className="w-10 h-10 text-secondary" />
                                    </div>
                                    <CardTitle className="text-3xl">Lifetime</CardTitle>
                                    <CardDescription>A one-time purchase for power users who want it all.</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <div className="text-4xl font-bold mb-4">
                                        $9.99
                                        <span className="text-sm font-normal text-muted-foreground"> / one-time</span>
                                    </div>
                                    <ul className="space-y-2 text-left text-muted-foreground mt-12">
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Unlimited Tasks</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Bring Your Own AI Key</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Downloadable PDF Statistics</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Team Collaboration</li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-col gap-2">
                                    <Button size="lg" className="w-full" variant="secondary" onClick={() => handleCheckout(PADDLE_PRICE_IDS.lifetime)} disabled={isPaddleLoading}>
                                        {isPaddleLoading ? <Loader2 className="animate-spin" /> : 'Go Lifetime'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Pay once, own it forever.
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                     )}
                    <p className="text-xs text-muted-foreground mt-8 text-center">
                        All payments are processed securely by our partner, Paddle.
                    </p>
                </div>
            )}
        </main>
      </div>
    </>
  );
}

    