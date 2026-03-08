
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PomodoroSettings, PomodoroSession, Task } from "@/lib/types";
import { SESSIONS_STORAGE_KEY } from "@/lib/constants";
import { subDays, isToday, parseISO } from "date-fns";

type TimerMode = "work" | "break";

export function usePomodoro(
  settings: PomodoroSettings, 
  activeTask: Task | null, 
  updateTask: (task: Task) => void,
  isInfinite: boolean
) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const targetTimeRef = useRef<number>(0);

  const updateTaskRef = useRef(updateTask);
  useEffect(() => {
    updateTaskRef.current = updateTask;
  }, [updateTask]);


  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        // Filter sessions to only include today's for the free tier
        const parsedSessions: PomodoroSession[] = JSON.parse(storedSessions);
        const todaySessions = parsedSessions.filter(s => isToday(parseISO(s.completedAt)));
        setSessions(todaySessions);
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
      setSessions([]);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // In a real app, you'd check the user's plan.
      // For now, we assume all users are on the free plan which resets daily.
      // So we only save today's sessions.
      const todaySessions = sessions.filter(s => isToday(parseISO(s.completedAt)));
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(todaySessions));
    }
  }, [sessions, isInitialized]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
    }
  }, []);

  const playNotification = useCallback(() => {
    audioRef.current?.play().catch(console.error);
    if (Notification.permission === "granted") {
      new Notification("focusinflow", {
        body: `${mode === "work" ? "Work" : "Break"} session has ended!`,
        icon: "/favicon.ico",
      });
    }
  }, [mode]);

  const handleTimerEnd = useCallback(() => {
    playNotification();
    if (mode === "work") {
      if (activeTask) {
        const updatedTask = {
          ...activeTask,
          pomodoroSessions: (activeTask.pomodoroSessions || 0) + 1,
        };
        updateTaskRef.current(updatedTask);

        const newSession: PomodoroSession = {
          id: crypto.randomUUID(),
          completedAt: new Date().toISOString(),
          workMinutes: settings.workMinutes,
          breakMinutes: settings.breakMinutes,
          taskId: activeTask.id,
          taskTitle: activeTask.title,
        };
        setSessions((prev) => [...prev, newSession]);
      }
      setMode("break");
      const newTimeLeft = settings.breakMinutes * 60;
      setTimeLeft(newTimeLeft);
      targetTimeRef.current = Date.now() + newTimeLeft * 1000;
      // Keep the timer active for the break session
      setIsActive(true);
    } else {
      setMode("work");
      const newTimeLeft = settings.workMinutes * 60;
      setTimeLeft(newTimeLeft);
      targetTimeRef.current = Date.now() + newTimeLeft * 1000;
      // After a full cycle, pause the timer unless in infinite mode
      setIsActive(isInfinite);
    }
  }, [mode, playNotification, activeTask, settings, isInfinite]);


  useEffect(() => {
    if (isActive) {
      if(targetTimeRef.current === 0) {
        targetTimeRef.current = Date.now() + timeLeft * 1000;
      }
      
      timerRef.current = setInterval(() => {
        const newTimeLeft = Math.round((targetTimeRef.current - Date.now()) / 1000);
        if (newTimeLeft <= 0) {
          setTimeLeft(0);
          handleTimerEnd();
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 250); // Check 4 times a second for better accuracy
    } else {
      if(timerRef.current) clearInterval(timerRef.current);
      targetTimeRef.current = 0;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, handleTimerEnd, timeLeft]);


  useEffect(() => {
    if (!isActive) {
      setTimeLeft(
        (mode === "work" ? settings.workMinutes : settings.breakMinutes) * 60
      );
    }
  }, [settings, mode, isActive]);

  const startTimer = useCallback(() => {
    if (!activeTask) return;
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    setIsActive(true);
  }, [activeTask]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
    if(timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setMode("work");
    setTimeLeft(settings.workMinutes * 60);
  }, [settings]);

  const skipToBreak = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if(activeTask && mode === 'work') {
        const updatedTask = {
            ...activeTask,
            pomodoroSessions: (activeTask.pomodoroSessions || 0) + 1,
          };
        updateTaskRef.current(updatedTask);
        const newSession: PomodoroSession = {
            id: crypto.randomUUID(),
            completedAt: new Date().toISOString(),
            workMinutes: settings.workMinutes,
            breakMinutes: settings.breakMinutes,
            taskId: activeTask.id,
            taskTitle: activeTask.title,
        };
        setSessions((prev) => [...prev, newSession]);
    }
    setMode('break');
    const newTimeLeft = settings.breakMinutes * 60;
    setTimeLeft(newTimeLeft);
    targetTimeRef.current = Date.now() + newTimeLeft * 1000;
    setIsActive(true);
  }, [settings, activeTask, mode]);

  const skipToWork = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode('work');
    const newTimeLeft = settings.workMinutes * 60;
    setTimeLeft(newTimeLeft);
    targetTimeRef.current = Date.now() + newTimeLeft * 1000;
    setIsActive(true);
  }, [settings]);


  return {
    mode,
    isActive,
    timeLeft,
    sessions,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToWork,
  };
}
