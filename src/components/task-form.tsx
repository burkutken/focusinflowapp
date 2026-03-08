
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Trash2, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Task, TaskStep, UserProfile } from "@/lib/types";
import { IMPORTANCE_LEVELS } from "@/lib/constants";
import { ScrollArea } from "./ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";

const userProfileSchema = z.object({
    uid: z.string(),
    email: z.string().email().nullable(),
    displayName: z.string().nullable().optional(),
    photoURL: z.string().nullable().optional(),
});

const taskStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Step title cannot be empty."),
  completed: z.boolean(),
  completedBy: z.string().nullable().optional(),
});

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().optional(),
  importance: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.date({ required_error: "A deadline is required." }),
  steps: z.array(taskStepSchema).optional(),
  members: z.array(userProfileSchema).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Task, "id" | "createdAt" | "userId" | "pomodoroSessions" | "completedAt">) => void;
  taskToEdit?: Task | null;
  showMembers?: boolean;
};

const getInitials = (email: string | null | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
}

export default function TaskForm({
  isOpen,
  onOpenChange,
  onSubmit,
  taskToEdit,
  showMembers = true,
}: TaskFormProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [memberEmail, setMemberEmail] = useState("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
        title: "",
        description: "",
        importance: "medium",
        deadline: undefined,
        steps: [],
        members: [],
    },
  });

  useEffect(() => {
    if (taskToEdit) {
        form.reset({
            ...taskToEdit,
            deadline: new Date(taskToEdit.deadline),
            members: taskToEdit.members || [],
        });
    } else {
        const currentUserProfile: UserProfile | undefined = user ? { uid: user.uid, email: user.email } : undefined;
        form.reset({
            title: "",
            description: "",
            importance: "medium",
            deadline: new Date(),
            steps: [],
            members: currentUserProfile ? [currentUserProfile] : [],
        });
    }
  }, [taskToEdit, form, user]);

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: "steps",
  });
  
  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
    control: form.control,
    name: "members"
  });
  
  const handleAddMember = () => {
    if(memberEmail && !memberFields.some(m => m.email === memberEmail)) {
        // In a real app, you'd look up the user by email in Firestore.
        // For now, we'll just create a mock profile.
        const mockMember: UserProfile = {
            uid: crypto.randomUUID(), // This is temporary, will be resolved on the backend
            email: memberEmail
        };
        appendMember(mockMember);
        setMemberEmail("");
    }
  }

  const handleSubmit = (data: TaskFormValues) => {
    const finalData = {
      ...data,
      deadline: data.deadline.toISOString(),
      steps: data.steps?.map(step => ({...step, id: step.id || crypto.randomUUID()})) || [],
      members: data.members || [],
    }
    onSubmit(finalData);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Design the new dashboard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add more details about the task..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {IMPORTANCE_LEVELS.map((level) => (
                            <SelectItem key={level} value={level} className="capitalize">
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deadline</FormLabel>
                       {isMobile ? (
                         <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            className="rounded-md border"
                          />
                       ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                       )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                {showMembers && (
                  <div>
                      <FormLabel>Members</FormLabel>
                      <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2">
                              <Input
                                  type="email"
                                  placeholder="member@example.com"
                                  value={memberEmail}
                                  onChange={(e) => setMemberEmail(e.target.value)}
                              />
                              <Button type="button" onClick={handleAddMember}>Add</Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {memberFields.map((member, index) => (
                                  <Badge key={member.id} variant="secondary" className="flex items-center gap-2">
                                      <Avatar className="w-5 h-5">
                                          <AvatarFallback>{getInitials(member.email)}</AvatarFallback>
                                      </Avatar>
                                      {member.email}
                                      {member.uid !== user?.uid && (
                                          <button onClick={() => removeMember(index)}>
                                              <XIcon className="w-3 h-3"/>
                                          </button>
                                      )}
                                  </Badge>
                              ))}
                          </div>
                      </div>
                  </div>
                )}

              <div>
                <FormLabel>Checklist (Optional)</FormLabel>
                <div className="space-y-2 mt-2">
                  {stepFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                          control={form.control}
                          name={`steps.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Input {...field} placeholder={`Step ${index + 1}`} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                   <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendStep({ title: "", completed: false, completedBy: null })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                </div>
              </div>
            </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="submit">{taskToEdit ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
