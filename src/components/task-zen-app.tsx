
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { PlusCircle, Settings, CheckCircle2, Palette, MonitorPlay } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import TaskForm from "@/components/task-form";
import TaskCard from "@/components/task-card";
import PomodoroTimer from "@/components/pomodoro-timer";
import SettingsDialog from "@/components/settings-dialog";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@/lib/constants";
import type { Task, PomodoroSettings } from "@/lib/types";
import CompletedTaskCard from "./completed-task-card";
import AppearanceSettingsDialog from "./appearance-settings-dialog";
import ProfileDialog from "./profile-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { auth } from "@/lib/firebase";

const AdSenseUnit = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const adPushed = useRef(false); // Flag to ensure ad is only pushed once

  const pushAd = () => {
    // Prevent multiple pushes
    if (adPushed.current) {
      console.log('AdSense already pushed, skipping.');
      return;
    }

    try {
      // Check if the ad slot exists and hasn't been filled
      const insElement = adRef.current?.querySelector('ins.adsbygoogle');
      if (insElement && insElement.getAttribute('data-ad-status') !== 'filled') {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true; // Set the flag to true after a successful push
        console.log('Pushed ad to AdSense.');
      } else {
        console.log('AdSense slot already filled or not found.');
      }
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  };

  useEffect(() => {
    const adContainer = adRef.current;
    if (!adContainer) return;

    // Function to check container visibility and push ad
    const checkAndPush = () => {
      // Only push if the container is ready and the ad hasn't been pushed yet
      if (adContainer.offsetWidth > 0 && !adPushed.current) {
        pushAd();
        return true; // Indicates success
      }
      return false; // Indicates container not ready or ad already pushed
    };

    // Try to push immediately
    if (checkAndPush()) {
      return;
    }

    // If not ready, use a MutationObserver to wait for it to become visible
    const observer = new MutationObserver(() => {
      if (checkAndPush()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      observer.disconnect();
      // Reset the flag if the component unmounts and remounts
      adPushed.current = false;
    };
  }, []);

  return (
    <div ref={adRef} className="w-full h-full">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client="ca-pub-7287803953590654"
        data-ad-slot="9802786093"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};


export default function TaskZenApp() {
  const { loading, isPremium, isLifetime } = useAuth();
  const { tasks, sortedTasks, completedTasks, addTask, updateTask, deleteTask, duplicateTask, isInitialized } = useTasks();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isInfinite, setIsInfinite] = useState(false);

  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const {
    mode,
    isActive,
    timeLeft,
    sessions,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToWork,
  } = usePomodoro(settings, activeTask, updateTask, isInfinite);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppearanceSettingsOpen, setIsAppearanceSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  const showAds = !isPremium && !isLifetime;
  
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleSettingsChange = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
  };
  
  const handleStopTimer = () => {
    resetTimer();
    setActiveTask(null);
  }

  const handleFormSubmit = (data: Omit<Task, "id" | "createdAt" | "userId" | "pomodoroSessions" | "completedAt">) => {
    if (taskToEdit) {
      updateTask({ ...taskToEdit, ...data });
    } else {
      addTask(data);
    }
    setTaskToEdit(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };
  
  const currentTaskForTimer = useMemo(() => {
    if (activeTask) return sortedTasks.find(t => t.id === activeTask.id) || null;
    return null;
  }, [activeTask, sortedTasks]);


  if (loading || !isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading your tasks...</div>;
  }
  
  if (activeTask && currentTaskForTimer) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <PomodoroTimer
          activeTask={currentTaskForTimer}
          mode={mode}
          isActive={isActive}
          isInfinite={isInfinite}
          timeLeft={timeLeft}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resetTimer={handleStopTimer}
          skip={mode === 'work' ? skipToBreak : skipToWork}
          onUpdateTask={updateTask}
          onToggleInfinite={() => setIsInfinite(prev => !prev)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onShowProfile={() => setIsProfileOpen(true)}
      />

      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold font-headline mb-4">
                Upcoming Tasks
              </h2>
               {sortedTasks.length > 0 ? (
                 <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                    <div className="space-y-4">
                    {sortedTasks.map((task, index) => (
                        <TaskCard
                        key={task.id}
                        task={task}
                        onStart={() => handleStartTask(task)}
                        onEdit={handleEditTask}
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        onDuplicate={duplicateTask}
                        isCurrent={index === 0}
                        />
                    ))}
                    </div>
                 </ScrollArea>
              ) : isInitialized ? (
                  <Card className="border-transparent">
                      <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No tasks yet. Add one to get started!</p>
                      </CardContent>
                  </Card>
              ) : null}
            </section>

            {completedTasks.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" />
                        Completed Tasks
                    </h2>
                    <div className="space-y-4">
                        {completedTasks.map(task => (
                            <CompletedTaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky top-8 self-start">
             <Button className="w-full" size="lg" onClick={() => { setTaskToEdit(null); setIsFormOpen(true); }}>
              <PlusCircle className="mr-2" />
              Add New Task
            </Button>
             <Button className="w-full" variant="outline" size="lg" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2" />
                Timer Settings
             </Button>
             <Button className="w-full" variant="outline" size="lg" onClick={() => setIsAppearanceSettingsOpen(true)}>
                <Palette className="mr-2" />
                Appearance
             </Button>
             {showAds && (
                <Card className="bg-muted border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MonitorPlay />
                            Unlock Stats with Ads
                        </CardTitle>
                        <CardDescription>Upgrade to a Premium or Lifetime plan to remove ads and support the developer.</CardDescription>
                    </CardHeader>
                    <CardContent className="bg-foreground/10 aspect-video flex items-center justify-center">
                        <AdSenseUnit />
                    </CardContent>
                </Card>
             )}
          </aside>
        </div>
      </main>

      <TaskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        taskToEdit={taskToEdit}
      />
      
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <AppearanceSettingsDialog
        isOpen={isAppearanceSettingsOpen}
        onOpenChange={setIsAppearanceSettingsOpen}
      />

      <ProfileDialog 
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        sessions={sessions}
        tasks={tasks}
      />
    </div>
  );
}
