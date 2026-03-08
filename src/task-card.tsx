
'use client';

import { useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  PlayCircle,
  Pencil,
  Trash2,
  CheckSquare,
  Sparkles,
  Copy,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getSuggestedTimeframe, getGeneratedChecklist } from '@/lib/actions';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SuggestTaskTimeframeOutput } from '@/ai/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type TaskCardProps = {
  task: Task;
  onStart?: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  isCurrent?: boolean;
};

export default function TaskCard({
  task,
  onStart,
  onEdit,
  onDelete,
  onUpdate,
  onDuplicate,
  isCurrent = false,
}: TaskCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestion, setSuggestion] =
    useState<SuggestTaskTimeframeOutput | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  const handleAIAssist = async (action: 'suggest' | 'checklist') => {
    if (!user) return;

    if (action === 'suggest') {
      setIsLoadingSuggestion(true);
      setSuggestionError(null);
      setSuggestion(null);
      const result = await getSuggestedTimeframe({
        taskDeadline: task.deadline,
        taskDescription: task.description || task.title,
        importanceLevel: task.importance,
      }, user.uid);
      if (result.data) {
        if(result.data.feedback) {
          setSuggestionError(result.data.feedback);
        } else {
          setSuggestion(result.data);
        }
      } else {
        toast({
            title: "AI Suggestion Failed",
            description: result.error,
            variant: "destructive"
        })
        setSuggestionError(result.error || 'An unknown error occurred.');
      }
      setIsLoadingSuggestion(false);
    } else if (action === 'checklist') {
      setIsLoadingChecklist(true);
      setSuggestionError(null);
      const result = await getGeneratedChecklist({
        taskTitle: task.title,
        taskDescription: task.description || task.title,
        existingSteps: task.steps,
      }, user.uid);

      if (result.data) {
          const newSteps = result.data.steps.map(step => ({
              id: crypto.randomUUID(),
              title: step.title,
              completed: false
          }));
          onUpdate({ ...task, steps: newSteps });
      } else {
           toast({
            title: "AI Checklist Failed",
            description: result.error,
            variant: "destructive"
        })
        setSuggestionError(result.error || "Failed to generate checklist.");
      }
      setIsLoadingChecklist(false);
    }
  };


  const handleStepToggle = (stepId: string) => {
    if (!task.steps) return;
    const updatedSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    onUpdate({ ...task, steps: updatedSteps });
  };

  const completedSteps = task.steps
    ? task.steps.filter((s) => s.completed).length
    : 0;
  const totalSteps = task.steps ? task.steps.length : 0;

  const importanceStyles = {
    low: 'bg-green-300/50 text-green-900 border-green-500',
    medium: 'bg-yellow-300/50 text-yellow-900 border-yellow-500',
    high: 'bg-orange-300/50 text-orange-900 border-orange-500',
    urgent: 'bg-red-300/50 text-red-900 border-red-500',
  };

  return (
    <TooltipProvider>
      <Card
        className={cn("transition-all", isCurrent && "border-primary shadow-[8px_8px_0_hsl(var(--primary))]")}
      >
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="font-headline text-lg">
              {task.title}
            </CardTitle>
            <Badge
              variant="outline"
              className={`capitalize shrink-0 ${importanceStyles[task.importance]}`}
            >
              {task.importance}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due{' '}
              {formatDistanceToNow(parseISO(task.deadline), { addSuffix: true })}
            </div>
            {totalSteps > 0 && (
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>
                  {completedSteps}/{totalSteps}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-4">
                {task.description && isExpanded && (
                <p className="text-sm text-muted-foreground">
                    {task.description}
                </p>
                )}
                {task.steps && task.steps.length > 0 && isExpanded && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Checklist</h4>
                    {task.steps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-2">
                        <Checkbox
                        id={`${task.id}-${step.id}`}
                        checked={step.completed}
                        onCheckedChange={() => handleStepToggle(step.id)}
                        />
                        <Label
                        htmlFor={`${task.id}-${step.id}`}
                        className={cn(
                            step.completed && 'line-through text-muted-foreground'
                        )}
                        >
                        {step.title}
                        </Label>
                    </div>
                    ))}
                </div>
                )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAssist('suggest')}
              disabled={isLoadingSuggestion}
            >
              {isLoadingSuggestion ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Get AI Suggestion
            </Button>
            {suggestion && (
              <Alert className="border-border rounded-none border-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">
                  AI Suggestion
                </AlertTitle>
                <AlertDescription>
                  <p>
                    Optimal Start:{' '}
                    <span className="font-medium">
                      {format(
                        parseISO(suggestion.suggestedTimeframe),
                        'PPP p'
                      )}
                    </span>
                  </p>
                    <p>
                    Estimated Duration:{' '}
                    <span className="font-medium">
                      {suggestion.estimatedDurationMinutes} minutes
                    </span>
                  </p>
                  <p className="text-xs mt-1">{suggestion.reasoning}</p>
                    <Button size="sm" className="mt-2" onClick={() => handleAIAssist('checklist')} disabled={isLoadingChecklist}>
                      {isLoadingChecklist ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {task.steps && task.steps.length > 0 ? 'Re-organize Checklist' : 'Generate Checklist'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {suggestionError && (
              <Alert variant="destructive" className="rounded-none border-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{suggestionError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Task</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onDuplicate(task)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate Task</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Task</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? 'Collapse' : 'Expand'}
              </TooltipContent>
            </Tooltip>
          </div>
          {onStart && (
            <Button onClick={() => onStart(task)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Focus
            </Button>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
