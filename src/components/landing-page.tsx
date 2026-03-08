
'use client';

import { Check, Clock, AppWindow, Blocks, Star, Download, Users, Bot, Code, BarChart2, Zap, Play, Pause, RotateCcw, PlayCircle, Calendar, CheckSquare, Lightbulb, Pencil, Copy, Trash2, ChevronDown, Plus, MonitorPlay, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { useState, useEffect, useRef } from 'react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import TaskForm from './task-form';
import TaskCard from './task-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const InteractiveTaskCreator = () => {
    const [task, setTask] = useState<any | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<any | null>(null);

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            const newTask = {
                id: 'demo-task-1',
                title: inputValue.trim(),
                importance: 'medium',
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                steps: [],
                members: [],
                memberIds: [],
                pomodoroSessions: 0,
                description: 'This is a demo task created on the landing page.',
                userId: 'demo-user',
                createdAt: new Date().toISOString(),
                completedAt: null,
            };
            setTask(newTask);
            setTaskToEdit(newTask);
            setIsFormOpen(true);
        }
    };

    const handleEdit = (task: any) => {
        setTaskToEdit(task);
        setIsFormOpen(true);
    };
    
    const handleFormSubmit = (data: any) => {
        const memberIds = data.members ? data.members.map((m: any) => m.uid) : [];
        setTask((prev: any) => ({ ...prev, ...data, deadline: data.deadline, memberIds }));
        setIsFormOpen(false);
        setTaskToEdit(null);
    }
    
    const createNewTask = () => {
        setTask(null);
        setInputValue('');
    }

    if (task) {
        return (
             <div className="relative">
                <TaskCard
                    task={task}
                    onEdit={handleEdit}
                    onDelete={createNewTask}
                    onUpdate={setTask}
                    onDuplicate={createNewTask}
                    onStart={() => {}}
                />
                 <TaskForm
                    isOpen={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    onSubmit={handleFormSubmit}
                    taskToEdit={taskToEdit}
                    showMembers={false}
                />
             </div>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Create a Demo Task</h2>
            <p className="text-muted-foreground mb-6">Enter a task you want to work on and see how it looks.</p>
            <form onSubmit={handleCreateTask} className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="e.g., Learn Next.js App Router"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-grow"
                />
                <Button type="submit">Create Task</Button>
            </form>
        </Card>
    );
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const InteractiveTimer = () => {
    const [workMinutes, setWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');

    useEffect(() => {
        if (!isActive) {
           setTimeLeft(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
        }
    }, [workMinutes, breakMinutes, mode, isActive]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if(isActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(t => t-1);
            }, 1000);
        } else if (timeLeft === 0) {
            if(mode === 'work') {
                setMode('break');
                setTimeLeft(breakMinutes * 60);
            } else {
                setMode('work');
                setTimeLeft(workMinutes * 60);
            }
            setIsActive(false);
        }

        return () => {
            if(timer) clearInterval(timer);
        }
    }, [isActive, timeLeft, mode, breakMinutes, workMinutes]);

    const handleReset = () => {
        setIsActive(false);
        setMode('work');
        setTimeLeft(workMinutes * 60);
    }
    
    const selectWorkTime = (minutes: number) => {
        setWorkMinutes(minutes);
        if (mode === 'work' && !isActive) {
            setTimeLeft(minutes * 60);
        }
    }
    
    const selectBreakTime = (minutes: number) => {
        setBreakMinutes(minutes);
         if (mode === 'break' && !isActive) {
            setTimeLeft(minutes * 60);
        }
    }
    
    return (
         <section className="py-20 md:py-28 bg-muted dark:bg-background/40">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                    Master Your Focus
                </h2>
                <p className="text-muted-foreground mt-2 mb-12 max-w-2xl mx-auto">
                    Use the Pomodoro timer to break down work into intervals. Select your desired focus and break durations, then press start.
                </p>
                <div className="flex justify-center items-center gap-8 md:gap-16">
                    {/* Work Time Selectors */}
                    <div className="flex flex-col gap-4">
                         <h3 className="font-bold text-lg text-muted-foreground">WORK</h3>
                         {[25, 45, 60].map(time => (
                             <Button key={time} variant={workMinutes === time ? 'default' : 'outline'} onClick={() => selectWorkTime(time)}>
                                 {time} min
                             </Button>
                         ))}
                    </div>

                    {/* Timer Circle */}
                    <div className="border-4 border-border rounded-full w-80 h-80 flex flex-col items-center justify-center bg-card shadow-[12px_12px_0_hsl(var(--border))]">
                        <p className="font-bold text-7xl text-center py-4 font-mono">
                            {formatTime(timeLeft)}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={handleReset} variant="outline" size="icon">
                                <RotateCcw className="w-5 h-5"/>
                            </Button>
                            <Button className="w-40" onClick={() => setIsActive(!isActive)}>
                                {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                                {isActive ? 'Pause' : 'Start Focus'}
                            </Button>
                        </div>
                    </div>
                    
                     {/* Break Time Selectors */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-lg text-muted-foreground">BREAK</h3>
                         {[5, 10, 15].map(time => (
                             <Button key={time} variant={breakMinutes === time ? 'default' : 'outline'} onClick={() => selectBreakTime(time)}>
                                 {time} min
                             </Button>
                         ))}
                    </div>
                </div>
            </div>
         </section>
    )
}

const FAQSection = () => {
  const faqs = [
    {
      question: 'What is the Pomodoro Technique?',
      answer:
        "The Pomodoro Technique is a time management method that uses a timer to break down work into focused 25-minute intervals, separated by short breaks. It's designed to improve focus and prevent mental fatigue.",
    },
    {
      question: 'How does the website blocker work?',
      answer:
        'The website blocker is part of our Chrome Extension, available to Premium members. During a "work" session, it prevents you from accessing a list of common distracting websites (like social media and video sites) by showing a "Stay Focused!" overlay, helping you stay on task.',
    },
    {
      question: 'Can I use focusinflow with my team?',
      answer:
        'Yes! The Lifetime plan includes team collaboration features. You can add members to your tasks, share checklists, and see who completes each item, making it great for group projects.',
    },
    {
      question: "What's the difference between the Premium and Lifetime plans?",
      answer:
        "The Premium plan is a recurring subscription that includes our managed AI service (no API key needed) and advanced browser integration like website blocking. The Lifetime plan is a one-time purchase that unlocks team collaboration and PDF exports, but requires you to bring your own AI key for GenAI features. Both remove ads and unlock all statistics.",
    },
    {
      question: 'Is my data safe?',
      answer:
        "Yes, we take your privacy seriously. All of your task and session data is stored securely in your own private Firebase database. We do not sell or share your personal data. Please see our Privacy Policy for more details.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-2">
            Have questions? We've got answers.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};


export default function LandingPage() {
    const [isAnnual, setIsAnnual] = useState(true);

  const features = [
    {
      icon: <Blocks className="w-8 h-8 text-primary" />,
      title: 'Intelligent Task Management',
      description:
        'Organize your to-do list with priorities, deadlines, and checklists.',
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: 'Pomodoro Focus Timer',
      description:
        'Boost your productivity with the proven Pomodoro technique.',
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'AI-Powered Scheduling',
      description:
        'Get smart suggestions on when to tackle your tasks and generate checklists.',
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-primary" />,
      title: 'Track Your Progress',
      description:
        'Visualize your accomplishments with beautiful charts and stats.',
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: 'Team Collaboration',
      description:
        'Share tasks and timers with your team for synchronized focus sessions.',
       badge: 'Soon'
    },
     {
      icon: <AppWindow className="w-8 h-8 text-primary" />,
      title: 'Website Blocker & Extension',
      description:
        'Integrate with a Chrome Extension to stay focused and track time wasters.',
       badge: 'Soon'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-6 tracking-tight">
                Take Control of Your Workflow
            </h1>
             <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-12">
                focusinflow gives you the power to organize tasks, master your time, and achieve your goals with an intuitive and beautiful interface. Try it live below.
             </p>
             <div className="relative max-w-2xl mx-auto">
                <InteractiveTaskCreator />
            </div>
          </div>
        </section>

        {/* Interactive Timer Section */}
        <InteractiveTimer />
        

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">
                Everything You Need to Be Productive
              </h2>
              <p className="text-muted-foreground mt-2">
                All the tools to help you focus and get things done.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/50 dark:bg-card/20 transition-all duration-300 hover:bg-card/80 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-md">{feature.icon}</div>
                    <div className="flex-grow">
                        <CardTitle className="pt-1">{feature.title}</CardTitle>
                        {feature.badge && <Badge variant="outline" className="mt-2">{feature.badge}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-muted dark:bg-background/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">
                Find the Plan That's Right For You
              </h2>
              <p className="text-muted-foreground mt-2">
                Start for free, or unlock powerful new features with our one-time purchase or premium subscription.
              </p>
               <div className="inline-flex items-center justify-center space-x-2 mt-4">
                  <Label htmlFor="billing-cycle">Monthly</Label>
                  <Switch id="billing-cycle" checked={isAnnual} onCheckedChange={setIsAnnual} />
                  <Label htmlFor="billing-cycle">Annually</Label>
                  <Badge variant="secondary" className="ml-2">Save 20%</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
              
              {/* Free Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription>For individuals getting started with focus techniques.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                   <div className="text-4xl font-bold mb-4">$0</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Unlimited Tasks</li>
                    <li className="flex items-center gap-2"><Code className="w-4 h-4 text-primary" />Bring Your Own AI Key</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Pomodoro Timer</li>
                    <li className="flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Daily statistics</li>
                    <li className="flex items-center gap-2"><MonitorPlay className="w-4 h-4 text-primary" />Unlock stats with ads</li>
                  </ul>
                </CardContent>
                <CardFooter>
                   <Button asChild className="w-full" variant="outline">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Premium Plan */}
              <Card className="flex flex-col border-primary shadow-lg">
                 <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">Premium</CardTitle>
                    <Badge variant="secondary">Full Power</Badge>
                  </div>
                  <CardDescription>Become a productivity superhero with an AI coach.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="text-4xl font-bold mb-4">
                    {isAnnual ? '$1.59' : '$1.99'}
                    <span className="text-sm font-normal text-muted-foreground">/ month</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center font-bold gap-2"><Star className="w-4 h-4 text-primary" />Everything in Lifetime</li>
                    <li className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" />Managed AI (No key needed)</li>
                    <li className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" />AI Insights on your stats</li>
                     <li className="flex items-center gap-2"><AppWindow className="w-4 h-4 text-primary" />Website tracking & blocking <Badge variant="outline" className="ml-2">Soon</Badge></li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Advanced Chrome Extension <Badge variant="outline" className="ml-2">Soon</Badge></li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/payments">Go Premium</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Lifetime Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">Lifetime</CardTitle>
                  <CardDescription>A one-time purchase for power users and teams.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="text-4xl font-bold mb-4">$9.99
                    <span className="text-sm font-normal text-muted-foreground"> / one-time</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Unlimited Tasks</li>
                    <li className="flex items-center gap-2"><Code className="w-4 h-4 text-primary" />Bring Your Own AI Key</li>
                    <li className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />No Ads</li>
                    <li className="flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />All Statistics Unlocked</li>
                    <li className="flex items-center gap-2"><Download className="w-4 h-4 text-primary" />Downloadable PDF Statistics</li>
                    <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Team Collaboration <Badge variant="outline" className="ml-2">Soon</Badge></li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="secondary">
                    <Link href="/payments">Go Lifetime</Link>
                  </Button>
                </CardFooter>
              </Card>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Call to Action Section */}
        <section className="py-20 text-center bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Reclaim Your Focus?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Sign up today and start turning your goals into accomplishments.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Sign Up Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
          <span>&copy; 2024 focusinflow. All rights reserved.</span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link>
            <a href="mailto:support@focusinflow.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

    

    

