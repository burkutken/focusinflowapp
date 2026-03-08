
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, UserProfile } from "@/lib/types";
import { IMPORTANCE_MAP } from "@/lib/constants";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isPremium, isLifetime } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsInitialized(false);
      return;
    }

    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("memberIds", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(userTasks);
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Could not fetch tasks. Please try again later.",
        variant: "destructive",
      });
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const addTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "userId" | "pomodoroSessions" | "completedAt"> & { members: UserProfile[] }) => {
        if (!user) return;
        
        const memberIds = Array.from(new Set([user.uid, ...taskData.members.map(m => m.uid)]));

        const newTask: Omit<Task, 'id'> = {
            ...taskData,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            pomodoroSessions: 0,
            completedAt: null,
            steps: taskData.steps || [],
            members: taskData.members,
            memberIds,
        };

        try {
            await addDoc(collection(db, "tasks"), newTask);
        } catch (error) {
            console.error("Error adding task:", error);
            toast({ title: "Error", description: "Could not create task.", variant: "destructive" });
        }
    },
    [user, toast]
  );

  const duplicateTask = useCallback(
    (taskToDuplicate: Task) => {
      const { title, description, importance, deadline, steps, members } = taskToDuplicate;
      const newTaskData = {
        title: `${title} (Copy)`,
        description,
        importance,
        deadline,
        steps: steps.map(step => ({ ...step, completed: false, completedBy: null })),
        members,
      };
      addTask(newTaskData as any);
    },
    [addTask]
  );

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!user) return;
    const taskRef = doc(db, "tasks", updatedTask.id);

    // When all steps are completed, mark the task as completed
    const areAllStepsCompleted = updatedTask.steps.length > 0 && updatedTask.steps.every(s => s.completed);
    const completedAt = areAllStepsCompleted && !updatedTask.completedAt ? new Date().toISOString() : updatedTask.completedAt;

    const memberIds = Array.from(new Set([updatedTask.userId, ...updatedTask.members.map(m => m.uid)]));

    try {
        await updateDoc(taskRef, { ...updatedTask, completedAt, memberIds });
    } catch(error) {
        console.error("Error updating task:", error);
        toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  }, [user, toast]);

  const deleteTask = useCallback(async (taskId: string) => {
     if (!user) return;
     const taskRef = doc(db, "tasks", taskId);
     try {
        await deleteDoc(taskRef);
     } catch(error) {
        console.error("Error deleting task:", error);
        toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
     }
  }, [user, toast]);

  const sortedTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completedAt)
      .sort((a, b) => {
        const importanceDiff =
          IMPORTANCE_MAP[b.importance] - IMPORTANCE_MAP[a.importance];
        if (importanceDiff !== 0) return importanceDiff;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [tasks]);

  const completedTasks = useMemo(() => {
      return tasks
        .filter(t => t.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [tasks]);

  return {
    tasks,
    sortedTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    isInitialized,
  };
}
