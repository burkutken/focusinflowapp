
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  X,
  ChevronDown,
  InfinityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type PomodoroTimerProps = {
  activeTask: Task | null;
  mode: "work" | "break";
  isActive: boolean;
  isInfinite: boolean;
  timeLeft: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skip: () => void;
  onUpdateTask: (task: Task) => void;
  onToggleInfinite: () => void;
};

export default function PomodoroTimer({
  activeTask,
  mode,
  isActive,
  isInfinite,
  timeLeft,
  startTimer,
  pauseTimer,
  resetTimer,
  skip,
  onUpdateTask,
  onToggleInfinite,
}: PomodoroTimerProps) {
  const [currentTask, setCurrentTask] = useState(activeTask);

  useEffect(() => {
    setCurrentTask(activeTask);
  }, [activeTask]);
  
  if (!currentTask) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleStepToggle = (stepId: string) => {
    const updatedSteps = currentTask.steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    const updatedTask = { ...currentTask, steps: updatedSteps };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const timerDisplay = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-8 transition-colors w-full h-full bg-background"
      )}
    >
      <div className="absolute top-4 left-4">
        <Button onClick={resetTimer} variant="ghost" size="icon" aria-label="Exit Timer">
          <X className="w-8 h-8" />
        </Button>
      </div>

       <div className="absolute top-4 right-4 flex items-center gap-2">
            <InfinityIcon className="w-5 h-5 text-muted-foreground" />
            <Switch
                checked={isInfinite}
                onCheckedChange={onToggleInfinite}
                aria-label="Toggle infinite mode"
            />
        </div>
      
      <div className="w-full flex-grow flex items-center justify-center">
        <div className="z-10 text-center">
          <div className="border-4 border-border rounded-full w-64 h-64 md:w-80 md:h-80 flex flex-col items-center justify-center bg-card shadow-[12px_12px_0_hsl(var(--border))]">
            <p
              className={cn(
                "text-6xl md:text-7xl font-bold font-mono tracking-tighter text-foreground"
              )}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
            <p className="text-lg uppercase tracking-widest text-muted-foreground mt-2">
              {mode}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-8 text-center w-full max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-foreground">
          {currentTask.title}
        </h2>
        
        {currentTask.steps && currentTask.steps.length > 0 && (
          <Card className="text-left max-h-[250px] overflow-hidden p-2 bg-muted shadow-none">
              <CardContent className="p-4 pb-2">
                  <h3 className="font-bold mb-2">Checklist</h3>
                  <ScrollArea className="h-[150px]">
                  <div className="space-y-2 pr-4 pb-2">
                  {currentTask.steps.map(step => (
                      <div key={step.id} className="flex items-center space-x-2 p-2 rounded-md">
                          <Checkbox id={`step-${step.id}`} checked={step.completed} onCheckedChange={() => handleStepToggle(step.id)} />
                          <Label htmlFor={`step-${step.id}`} className={cn("flex-grow", step.completed && "line-through text-muted-foreground")}>{step.title}</Label>
                      </div>
                  ))}
                  </div>
                  </ScrollArea>
              </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-8 flex items-center gap-4">
        <Button onClick={resetTimer} variant="outline" size="icon" aria-label="Reset Timer">
          <RotateCcw />
        </Button>
        <Button
          onClick={isActive ? pauseTimer : startTimer}
          size="lg"
          className="w-32"
          aria-label={isActive ? "Pause Timer" : "Start Timer"}
        >
          {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
          {isActive ? "Pause" : "Start"}
        </Button>
        <Button onClick={skip} variant="secondary" size="icon" aria-label="Skip session">
          <SkipForward />
        </Button>
      </div>
    </div>
  );

  return timerDisplay;
}
