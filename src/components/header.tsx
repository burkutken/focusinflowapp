
"use client";

import { LogOut, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type HeaderProps = {
  onShowProfile?: () => void;
};

export default function Header({ onShowProfile }: HeaderProps) {
  const { user, signOut } = useAuth();
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
  }

  return (
    <header className="py-4 px-4 md:px-8 relative">
      <div className="container mx-auto flex justify-between items-center relative z-10">
        <div className="flex-1"></div>
        <div className="flex-1 text-center relative">
            <Link href="/" className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }} aria-label="focusinflow home page">
                focusinflow
            </Link>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                        {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || "user avatar"}/>}
                        <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onShowProfile ? (
                    <DropdownMenuItem onClick={onShowProfile}><User className="mr-2" />Dashboard</DropdownMenuItem>
                ) : (
                    <DropdownMenuItem asChild>
                        <Link href="/tasks"><Home className="mr-2" />Dashboard</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
