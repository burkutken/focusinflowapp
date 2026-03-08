"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AppearanceSettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const themes = [
  { name: "Serene", class: "theme-serene" },
  { name: "Forest", class: "theme-forest" },
  { name: "Focus", class: "theme-focus" },
];

const AppearanceSettings = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="grid gap-6 py-4">
            <div className="grid gap-3">
                <Label>Color Palette</Label>
                <div className="grid grid-cols-3 gap-2">
                    {themes.map((t) => (
                        <div key={t.class}>
                             <Button
                                variant="outline"
                                className={cn("w-full h-16 border-4", theme === t.class && "border-ring")}
                                onClick={() => setTheme(t.class)}
                            >
                                <div className={cn("w-full h-full", t.class)}>
                                    <div className="flex items-center justify-center h-full bg-background/80 text-foreground text-sm font-bold">
                                        {t.name}
                                    </div>
                                </div>
                             </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}


export default function AppearanceSettingsDialog({
  isOpen,
  onOpenChange,
}: AppearanceSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Appearance Settings</DialogTitle>
            <DialogDescription>
                Customize the look and feel of the app.
            </DialogDescription>
        </DialogHeader>
        <AppearanceSettings />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
