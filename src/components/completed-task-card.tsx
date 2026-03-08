'use client';

import { useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Timer,
  CheckCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

type CompletedTaskCardProps = {
  task: Task;
};

export default function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className="bg-green-50 border-green-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
             <CheckCircle className="w-5 h-5 text-green-600" />
            {task.title}
          </CardTitle>
           <Button variant="ghost" size="icon" className="w-8 h-8">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        {task.completedAt && (
            <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Finished{' '}
                {formatDistanceToNow(parseISO(task.completedAt), { addSuffix: true })}
                </div>
                <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span>
                    {task.pomodoroSessions} session{task.pomodoroSessions !== 1 && 's'}
                </span>
                </div>
            </div>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {task.description && (
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            {task.steps && task.steps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Checklist</h4>
                {task.steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${task.id}-${step.id}`}
                      checked={step.completed}
                      disabled
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
        </CardContent>
      )}
    </Card>
  );
}
