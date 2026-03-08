
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function LandingHeader() {
  return (
    <header className="py-4 px-4 md:px-8 bg-muted/50 border-b">
      <div className="container mx-auto flex justify-between items-center relative z-10">
        <div className="flex-1 text-left relative">
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                focusinflow
            </h1>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
