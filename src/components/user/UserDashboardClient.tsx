'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, LogOut, Coffee, User, Briefcase, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityHistory } from './ActivityHistory';
import { UserNotificationBell } from './UserNotificationBell';

interface UserDashboardClientProps {
  user: Session['user'];
  initialLastEvent: string | undefined;
}

export function UserDashboardClient({ user, initialLastEvent }: UserDashboardClientProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastEvent, setLastEvent] = useState(initialLastEvent);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [questions, setQuestions] = useState(['']);

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, '']);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockAction = async (type: string, clockOutMessage?: string) => {
    if (type === 'OUT') {
      const activeQuestions = questions.filter(q => q.trim() !== '');
      const hasEmptyQuestionField = questions.some(q => q.trim() === '');
      if (hasEmptyQuestionField && activeQuestions.length > 0) {
        toast.error("Please fill out or remove empty question fields.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: clockOutMessage,
          questions: questions.filter(q => q.trim() !== '')
        }),
      });

      if (!res.ok) throw new Error('Action failed');

      toast.success(`Successfully Clocked ${type.replace('_', ' ').toLowerCase()}!`);

      if (type === 'BREAK_END') {
        setLastEvent('IN');
      } else {
        setLastEvent(type);
      }

      if (isDialogOpen) {
        setIsDialogOpen(false);
        setQuestions(['']);
        setMessage('');
      }

      setActivityRefreshKey(prevKey => prevKey + 1);
      router.refresh();
    } catch {
      toast.error('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (lastEvent) {
      case 'IN':
      case 'BREAK_END':
        return { text: 'Clocked In', color: 'text-green-500' };
      case 'BREAK_START':
        return { text: 'On Break', color: 'text-yellow-500' };
      default:
        return { text: 'Clocked Out', color: 'text-red-500' };
    }
  };

  const statusInfo = getStatusInfo();
  const isCurrentlyWorking = lastEvent === 'IN' || lastEvent === 'BREAK_END';
  const showClockIn = !lastEvent || lastEvent === 'OUT';
  const showClockOut = isCurrentlyWorking;
  const showBreakStart = isCurrentlyWorking;
  const showBreakEnd = lastEvent === 'BREAK_START';

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Image src="/thynetwork-logo.png" alt="ThyNetwork Logo" width={48} height={48} priority />
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-center text-foreground">ThyNetwork Time Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <UserNotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => signOut({ callbackUrl: '/' })}>
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="w-full text-center mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Your Current Status</CardTitle>
          <CardDescription className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.text}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl md:text-5xl font-semibold font-mono tracking-wider tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour12: true })}
          </p>
          <p className="text-muted-foreground mt-2">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
          <CardDescription>Manage your time and breaks here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {showClockIn && <Button onClick={() => handleClockAction('IN')} disabled={isLoading} size="lg"><LogIn className="mr-2 h-4 w-4" /> Clock In</Button>}
            {showClockOut && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="lg"><LogOut className="mr-2 h-4 w-4" /> Clock Out</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Daily Summary & Questions</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="summary-notes" className="mb-2 inline-block">Daily Summary</Label>
                      <Textarea id="summary-notes" placeholder="Enter a brief summary of what you did today..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                    </div>
                    <div>
                      <Label>Questions for Admin (Optional)</Label>
                      <div className="space-y-2 mt-2">
                        {questions.map((q, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input type="text" placeholder={`Question #${index + 1}`} value={q} onChange={(e) => handleQuestionChange(index, e.target.value)} />
                            {questions.length > 1 || (questions.length === 1 && questions[0] !== '') ? (
                              <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="mt-2" onClick={addQuestion}>Add Question</Button>
                    </div>
                  </div>

                  <Button onClick={() => handleClockAction('OUT', message)} disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Confirm Clock Out'}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
            {showBreakStart && <Button onClick={() => handleClockAction('BREAK_START')} disabled={isLoading} variant="secondary"><Coffee className="mr-2 h-4 w-4" /> Start Break</Button>}
            {showBreakEnd && <Button onClick={() => handleClockAction('BREAK_END')} disabled={isLoading} variant="outline"><Briefcase className="mr-2 h-4 w-4" /> End Break</Button>}
          </div>
        </CardContent>
      </Card>

      <ActivityHistory key={activityRefreshKey} />
    </div>
  );
}