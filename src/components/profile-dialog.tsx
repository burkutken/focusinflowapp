
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PomodoroSession, Task, UserRole } from "@/lib/types";
import { format, parseISO, startOfWeek, isSameMonth, startOfMonth } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Download, Gem, Star, Lock, Crown, Loader2, AlertTriangle, MonitorPlay, KeyRound, Eye, EyeOff } from "lucide-react";
import { generatePdf } from "@/lib/pdf";
import { getUserList } from "@/lib/actions";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "./ui/use-toast";


type ProfileDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sessions: PomodoroSession[];
    tasks: Task[];
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1967"];

const processData = (sessions: PomodoroSession[], tasks: Task[]) => {
    const daily: { [key: string]: number } = {};
    const weekly: { [key: string]: number } = {};
    const monthly: { [key: string]: number } = {};
    const byTask: { [key: string]: number } = {};
    const monthlyTaskDistribution: { [key: string]: number } = {};
    const now = new Date();
  
    const taskTitleMap = tasks.reduce((acc, task) => {
      acc[task.id] = task.title;
      return acc;
    }, {} as { [key: string]: string });
    
    sessions.forEach(session => {
      const date = parseISO(session.completedAt);
      const dayKey = format(date, "yyyy-MM-dd");
      const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d");
      const monthKey = format(date, "MMM yyyy");
      const taskTitle = session.taskId ? (taskTitleMap[session.taskId] || session.taskTitle || "Untitled Task") : "Untitled Task";
  
      daily[dayKey] = (daily[dayKey] || 0) + 1;
      weekly[weekKey] = (weekly[weekKey] || 0) + 1;
      monthly[monthKey] = (monthly[monthKey] || 0) + 1;
      byTask[taskTitle] = (byTask[taskTitle] || 0) + session.workMinutes;
      
      if (isSameMonth(date, now)) {
        monthlyTaskDistribution[taskTitle] = (monthlyTaskDistribution[taskTitle] || 0) + session.workMinutes;
      }
    });
  
    const formatForChart = (data: { [key: string]: number }) => 
      Object.entries(data).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    
    const formatForPieChart = (data: { [key: string]: number }) =>
      Object.entries(data).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  
    return {
      daily: formatForChart(daily).slice(0, 12),
      weekly: formatForChart(weekly).slice(0,12),
      monthly: formatForChart(monthly).slice(0,12),
      byTask: formatForChart(byTask),
      monthlyTaskDistribution: formatForPieChart(monthlyTaskDistribution),
    };
  };

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <Card className="text-center bg-primary/5">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">{value}</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
    </Card>
);

const AdGatedContent = ({ title, onUnlock }: { title: string; onUnlock: () => void }) => (
    <div className="h-[422px] flex items-center justify-center">
        <Card className="p-4 bg-muted border-dashed max-w-md mx-auto">
           <div className="flex flex-col items-center gap-2 text-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="font-bold text-lg">Unlock {title}</h3>
                <p className="text-sm text-muted-foreground">
                    Watch a short ad to view this content or upgrade to remove all ads.
                </p>
                <Button onClick={onUnlock} className="mt-2">
                    <MonitorPlay className="mr-2 h-4 w-4" />
                    Watch Ad to Unlock
                </Button>
            </div>
        </Card>
    </div>
);


const BarChartComponent = ({ data, label, valueLabel, layout = "horizontal" }: { data: {name: string, count: number}[], label: string, valueLabel: string, layout?: "horizontal" | "vertical" }) => (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {data.length > 0 ? (
          <ChartContainer config={{}} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout={layout} margin={{ top: 20, right: 20, bottom: 5, left: layout === 'vertical' ? 50 : 0 }}>
                <CartesianGrid vertical={layout === 'horizontal'} horizontal={layout === 'vertical'} />
                {layout === 'horizontal' ? (
                  <>
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  </>
                ) : (
                  <>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ width: 150 }} />
                  </>
                )}
                
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" formatter={(value) => `${value} ${valueLabel}`}/>}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No session data available for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );

const PieChartComponent = ({ data, title }: { data: {name: string, value: number}[], title: string }) => {
    const chartConfig = data.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        };
        return acc;
    }, {} as any);
    
    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip 
                                    cursor={false} 
                                    content={<ChartTooltipContent formatter={(value) => `${value} minutes`} />} 
                                />
                                <Pie 
                                    data={data} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={120} 
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                       No session data available for this month.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TeamMembersTab = () => {
    const [users, setUsers] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            const result = await getUserList();
            if (result.data) {
                setUsers(result.data);
            } else {
                setError(result.error || 'An unknown error occurred.');
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>View all users and their account status.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}
                {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                {!loading && !error && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.uid}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            user.status === 'Premium' ? 'default' :
                                            user.status === 'Lifetime' ? 'secondary' : 'outline'
                                        }>{user.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};


export default function ProfileDialog({ isOpen, onOpenChange, sessions, tasks }: ProfileDialogProps) {
  const { user, userProfile, loading, isPremium, isLifetime, saveUserProfile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [unlockedStats, setUnlockedStats] = useState({ weekly: false, monthly: false });
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
        setNickname(userProfile.displayName || "");
        setApiKey(userProfile.apiKey || "");
    }
  }, [userProfile]);

  const chartData = useMemo(() => processData(sessions, tasks), [sessions, tasks]);
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.workMinutes, 0);

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await saveUserProfile(nickname, apiKey);
    setIsSaving(false);
  };

  const handleUnlockStat = (stat: 'weekly' | 'monthly') => {
    toast({
        title: "Ad Finished!",
        description: `You've unlocked ${stat} statistics.`
    });
    setUnlockedStats(prev => ({ ...prev, [stat]: true }));
  }

  const handleDownloadPdf = () => {
    if(!user) return;
    generatePdf(chartData, {
        userName: userProfile?.displayName || user.email || 'User',
        totalSessions,
        totalMinutes
    });
  };
  
  const hasPaidTier = isPremium || isLifetime;

  const hasDefaultNickname = useMemo(() => {
    if (!user || !userProfile) return true;
    const emailPrefix = user.email?.split('@')[0];
    return userProfile.displayName === emailPrefix;
  }, [user, userProfile]);

  if (loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>My Dashboard</DialogTitle>
            <DialogDescription>
                View and manage your account details and statistics.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6">
            <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="team">Team Members</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                    Your account details and subscription status.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            {user?.photoURL && <AvatarImage src={user.photoURL} alt={userProfile?.displayName || "user avatar"}/>}
                            <AvatarFallback className="text-2xl">{getInitials(user?.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-1">
                             <div className="space-y-1">
                                <Label htmlFor="nicknameDisplay" className="text-xs">Nickname</Label>
                                <p id="nicknameDisplay" className="font-semibold text-xl">{userProfile?.displayName || 'No nickname set'}</p>
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="email" className="text-xs">Email</Label>
                                <p id="email" className="text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Account Status</Label>
                        <Card className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isPremium && <Gem className="w-5 h-5 text-yellow-500" />}
                                {isLifetime && <Crown className="w-5 h-5 text-purple-500" />}
                                {!hasPaidTier && <Star className="w-5 h-5 text-slate-400" />}
                                <div>
                                    <p className="font-bold">
                                        {isLifetime ? 'Lifetime Member' : isPremium ? 'Premium Member' : 'Free Member'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {hasPaidTier ? 'You have access to all paid features!' : 'Upgrade for more features.'}
                                    </p>
                                </div>
                            </div>
                            {!hasPaidTier && <Button asChild><Link href="/payments">Upgrade</Link></Button>}
                        </Card>
                    </div>

                    <Card className={cn(hasDefaultNickname && "border-dashed")}>
                         <CardHeader>
                            <CardTitle className="text-lg">Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="nicknameEdit">Nickname</Label>
                                <Input id="nicknameEdit" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Enter your nickname" disabled={!hasDefaultNickname} />
                                {hasDefaultNickname ? (
                                    <p className="text-xs text-muted-foreground mt-1">You can set your public nickname once.</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-1">Your nickname is permanent.</p>
                                )}
                            </div>
                            
                            {!isPremium && (
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="apiKey">Google AI API Key</Label>
                                    {userProfile?.apiKey ? (
                                        <Badge variant="secondary" className="border-green-500 text-green-700">Saved</Badge>
                                    ) : (
                                        <Badge variant="outline">Not Saved</Badge>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input id="apiKey" type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" />
                                    <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0 right-0 h-full px-3"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                    {showApiKey ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                        {showApiKey ? "Hide key" : "Show key"}
                                    </span>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {isLifetime 
                                        ? "As a Lifetime member, add your own key for unlimited AI feature usage."
                                        : "Add your own Google AI key to get unlimited AI feature usage."
                                    }
                                </p>
                            </div>
                            )}
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="stats">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <StatCard title="Total Focus Sessions" value={totalSessions} />
                    <StatCard title="Total Focus Minutes" value={totalMinutes} />
                </div>
                 <Tabs defaultValue="monthly-dist" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="monthly-dist">This Month</TabsTrigger>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly" disabled={!hasPaidTier && !unlockedStats.weekly}>Weekly</TabsTrigger>
                        <TabsTrigger value="monthly" disabled={!hasPaidTier && !unlockedStats.monthly}>Monthly</TabsTrigger>
                        <TabsTrigger value="byTask">Total by Task</TabsTrigger>
                    </TabsList>
                    <TabsContent value="monthly-dist">
                        <PieChartComponent data={chartData.monthlyTaskDistribution} title="This Month's Focus Distribution" />
                    </TabsContent>
                    <TabsContent value="daily">
                        <BarChartComponent data={chartData.daily} label="Daily Sessions" valueLabel="sessions"/>
                    </TabsContent>
                    <TabsContent value="weekly">
                        {hasPaidTier || unlockedStats.weekly ? (
                            <BarChartComponent data={chartData.weekly} label="Weekly Sessions" valueLabel="sessions"/>
                        ) : (
                            <AdGatedContent title="Weekly Stats" onUnlock={() => handleUnlockStat('weekly')} />
                        )}
                    </TabsContent>
                    <TabsContent value="monthly">
                         {hasPaidTier || unlockedStats.monthly ? (
                            <BarChartComponent data={chartData.monthly} label="Monthly Sessions" valueLabel="sessions"/>
                         ) : (
                            <AdGatedContent title="Monthly Stats" onUnlock={() => handleUnlockStat('monthly')} />
                         )}
                    </TabsContent>
                    <TabsContent value="byTask">
                        <BarChartComponent data={chartData.byTask} label="Total Focus Minutes Per Task" valueLabel="minutes" layout="vertical" />
                    </TabsContent>
                </Tabs>
                <div className="mt-6 text-center">
                    {hasPaidTier ? (
                         <Button onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Statistics as PDF
                        </Button>
                    ) : (
                        <Card className="p-4 bg-muted border-dashed max-w-md mx-auto">
                           <div className="flex flex-col items-center gap-2 text-center">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                                <h3 className="font-bold text-lg">Unlock PDF Downloads</h3>
                                <p className="text-sm text-muted-foreground">
                                    Upgrade to a Lifetime or Premium plan to download your statistics reports.
                                </p>
                                <Button asChild className="mt-2">
                                    <Link href="/payments">Unlock with Premium</Link>
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </TabsContent>
             <TabsContent value="team">
                <TeamMembersTab />
             </TabsContent>
            </Tabs>
        </div>
         <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    