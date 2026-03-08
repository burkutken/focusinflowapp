"use client";

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
import { Slider } from "@/components/ui/slider";
import type { PomodoroSettings } from "@/lib/types";

type SettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: PomodoroSettings;
  onSettingsChange: (newSettings: PomodoroSettings) => void;
};

const TimerSettings = ({ settings, onSettingsChange }: { settings: PomodoroSettings, onSettingsChange: (newSettings: PomodoroSettings) => void }) => {
    const handleWorkMinutesChange = (value: number[]) => {
        onSettingsChange({ ...settings, workMinutes: value[0] });
    };

    const handleBreakMinutesChange = (value: number[]) => {
        onSettingsChange({ ...settings, breakMinutes: value[0] });
    };
    
    return (
        <div className="grid gap-6 py-4">
        <div className="grid gap-3">
            <div className="flex justify-between items-center">
            <Label htmlFor="work-minutes">Work Duration (minutes)</Label>
            <span className="font-bold text-primary">{settings.workMinutes}</span>
            </div>
            <Slider
            id="work-minutes"
            min={15}
            max={60}
            step={5}
            value={[settings.workMinutes]}
            onValueChange={handleWorkMinutesChange}
            />
        </div>
        <div className="grid gap-3">
            <div className="flex justify-between items-center">
            <Label htmlFor="break-minutes">Break Duration (minutes)</Label>
            <span className="font-bold text-accent">{settings.breakMinutes}</span>
            </div>
            <Slider
            id="break-minutes"
            min={5}
            max={25}
            step={1}
            value={[settings.breakMinutes]}
            onValueChange={handleBreakMinutesChange}
            />
        </div>
        </div>
    )
}

export default function SettingsDialog({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
            <DialogDescription>
                Customize your focus intervals.
            </DialogDescription>
        </DialogHeader>
        <TimerSettings settings={settings} onSettingsChange={onSettingsChange} />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
