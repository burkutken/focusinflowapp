import LandingHeader from "@/components/landing-header";
import LandingPage from "@/components/landing-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: "focusinflow's method for task management supports both the pomodoro technique alongside goal-oriented focus with AI assistant.",
};

export default function Home() {
  return (
    <main>
      <LandingHeader />
      <LandingPage />
    </main>
  );
}
