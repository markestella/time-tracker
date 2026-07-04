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
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BrandMark } from '@/components/brand/BrandMark';
import { TaskWithCount } from '@/types';
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Flag,
  ListChecks,
  LogIn,
  LogOut,
  Plus,
  Timer,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ActivityHistory } from './ActivityHistory';
import { UserNotificationBell } from './UserNotificationBell';

interface UserDashboardClientProps {
  user: Session['user'];
  initialLastEvent: string | undefined;
}

const taskStatusLabels = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

const taskPriorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export function UserDashboardClient({ user, initialLastEvent }: UserDashboardClientProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastEvent, setLastEvent] = useState(initialLastEvent);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [questions, setQuestions] = useState(['']);
  const [tasks, setTasks] = useState<TaskWithCount[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  const activeTasks = tasks.filter((task) => task.status !== 'DONE');
  const doneTasks = tasks.filter((task) => task.status === 'DONE');
  const selectedTask = tasks.find((task) => task.id.toString() === selectedTaskId);

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
    setQuestions(newQuestions.length > 0 ? newQuestions : ['']);
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to load tasks');
      const data: TaskWithCount[] = await res.json();
      setTasks(data);
      setSelectedTaskId((current) => {
        if (current && data.some((task) => task.id.toString() === current && task.status !== 'DONE')) {
          return current;
        }
        return data.find((task) => task.status === 'IN_PROGRESS')?.id.toString() ?? '';
      });
    } catch {
      toast.error('Could not load your tasks.');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchTasks();
    return () => clearInterval(timer);
  }, []);

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Add a task title first.');
      return;
    }

    setIsTaskLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');

      const createdTask: TaskWithCount = await res.json();
      setTasks((current) => [createdTask, ...current]);
      setSelectedTaskId(createdTask.id.toString());
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
      toast.success('Task added and selected.');
    } catch {
      toast.error('Could not create task.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setIsTaskLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      const updatedTask: TaskWithCount = await res.json();
      setTasks((current) => current.map((task) => (task.id === taskId ? updatedTask : task)));
      if (status === 'DONE' && selectedTaskId === taskId.toString()) {
        setSelectedTaskId('');
      } else if (status === 'IN_PROGRESS') {
        setSelectedTaskId(taskId.toString());
      }
      toast.success(status === 'DONE' ? 'Task completed.' : 'Task updated.');
    } catch {
      toast.error('Could not update task.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    setIsTaskLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks((current) => current.filter((task) => task.id !== taskId));
      if (selectedTaskId === taskId.toString()) {
        setSelectedTaskId('');
      }
      setActivityRefreshKey((prevKey) => prevKey + 1);
      toast.success('Task removed.');
    } catch {
      toast.error('Could not remove task.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleClockAction = async (type: string, clockOutMessage?: string) => {
    if (type === 'OUT') {
      const activeQuestions = questions.filter(q => q.trim() !== '');
      const hasEmptyQuestionField = questions.some(q => q.trim() === '');
      if (hasEmptyQuestionField && activeQuestions.length > 0) {
        toast.error('Please fill out or remove empty question fields.');
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
          taskId: selectedTaskId || undefined,
          message: clockOutMessage,
          questions: questions.filter(q => q.trim() !== ''),
        }),
      });

      if (!res.ok) throw new Error('Action failed');

      toast.success(`Successfully clocked ${type.replace('_', ' ').toLowerCase()}.`);

      if (type === 'BREAK_END') {
        setLastEvent('IN');
      } else {
        setLastEvent(type);
      }

      if (type === 'IN' && selectedTaskId) {
        await updateTaskStatus(parseInt(selectedTaskId), 'IN_PROGRESS');
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
        return { text: 'Clocked In', color: 'text-primary', detail: 'Your time is being tracked.' };
      case 'BREAK_START':
        return { text: 'On Break', color: 'text-amber-600', detail: 'Break time is active.' };
      default:
        return { text: 'Clocked Out', color: 'text-destructive', detail: 'Start a session when you are ready.' };
    }
  };

  const statusInfo = getStatusInfo();
  const isCurrentlyWorking = lastEvent === 'IN' || lastEvent === 'BREAK_END';
  const showClockIn = !lastEvent || lastEvent === 'OUT';
  const showClockOut = isCurrentlyWorking;
  const showBreakStart = isCurrentlyWorking;
  const showBreakEnd = lastEvent === 'BREAK_START';

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
        <BrandMark />
        <div className="hidden text-center md:block">
          <h1 className="text-2xl font-semibold text-foreground">Mckbyte TimeTracker</h1>
          <p className="text-sm text-muted-foreground">Time, tasks, and daily clarity</p>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">Today&apos;s Clock</CardTitle>
                  <CardDescription>{statusInfo.detail}</CardDescription>
                </div>
                <Badge variant="secondary" className={`text-sm ${statusInfo.color}`}>
                  {statusInfo.text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="font-mono text-4xl font-semibold tracking-normal tabular-nums md:text-6xl">
                  {currentTime.toLocaleTimeString('en-US', { hour12: true })}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="rounded-lg border bg-secondary/50 p-4">
                <Label htmlFor="active-task" className="mb-2 block">Active task for this session</Label>
                <select
                  id="active-task"
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">No task selected</option>
                  {activeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedTask ? `Time entries will be linked to "${selectedTask.title}".` : 'Create or select a task to connect work with time.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {showClockIn && (
                  <Button onClick={() => handleClockAction('IN')} disabled={isLoading} size="lg">
                    <LogIn className="h-4 w-4" /> Clock In
                  </Button>
                )}
                {showClockOut && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="lg">
                        <LogOut className="h-4 w-4" /> Clock Out
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[520px]">
                      <DialogHeader>
                        <DialogTitle>Daily Summary & Questions</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 p-1 sm:p-4 max-h-[60vh] overflow-y-auto">
                        {selectedTask && (
                          <div className="rounded-md border bg-secondary/50 p-3 text-sm">
                            Closing time against <span className="font-medium">{selectedTask.title}</span>
                          </div>
                        )}
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
                {showBreakStart && (
                  <Button onClick={() => handleClockAction('BREAK_START')} disabled={isLoading} variant="secondary">
                    <Coffee className="h-4 w-4" /> Start Break
                  </Button>
                )}
                {showBreakEnd && (
                  <Button onClick={() => handleClockAction('BREAK_END')} disabled={isLoading} variant="outline">
                    <Briefcase className="h-4 w-4" /> End Break
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <ActivityHistory key={activityRefreshKey} />
        </section>

        <section className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle>Task Tracker</CardTitle>
              </div>
              <CardDescription>Create tasks, link them to time, and mark completed work.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTask} className="space-y-3">
                <Input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Add a task to work on..."
                  disabled={isTaskLoading}
                />
                <Textarea
                  value={newTaskDescription}
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                  placeholder="Optional details"
                  rows={3}
                  disabled={isTaskLoading}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={newTaskPriority}
                    onChange={(event) => setNewTaskPriority(event.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
                    disabled={isTaskLoading}
                  >
                    <option value="LOW">Low priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="HIGH">High priority</option>
                  </select>
                  <Button type="submit" disabled={isTaskLoading} className="sm:flex-1">
                    <Plus className="h-4 w-4" /> Add Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <Timer className="h-4 w-4 text-primary" />
              <p className="mt-2 text-2xl font-semibold">{activeTasks.length}</p>
              <p className="text-sm text-muted-foreground">Active tasks</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <p className="mt-2 text-2xl font-semibold">{doneTasks.length}</p>
              <p className="text-sm text-muted-foreground">Done</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <ListChecks className="h-4 w-4 text-primary" />
              <p className="mt-2 text-2xl font-semibold">{tasks.reduce((total, task) => total + task._count.clockEvents, 0)}</p>
              <p className="text-sm text-muted-foreground">Linked logs</p>
            </div>
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>{tasks.length > 0 ? 'Pick what you are working on or close completed items.' : 'Your task list is ready for the first item.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="font-medium">No tasks yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Add one above to connect your time to actual work.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{task.title}</p>
                            {selectedTaskId === task.id.toString() && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="secondary">{taskStatusLabels[task.status]}</Badge>
                            <Badge variant="outline">
                              <Flag className="h-3 w-3" /> {taskPriorityLabels[task.priority]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{task._count.clockEvents} linked logs</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          disabled={isTaskLoading}
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {task.status !== 'DONE' && (
                          <Button
                            type="button"
                            variant={selectedTaskId === task.id.toString() ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedTaskId(task.id.toString())}
                          >
                            Use for time
                          </Button>
                        )}
                        {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                          <Button type="button" variant="outline" size="sm" onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} disabled={isTaskLoading}>
                            Start
                          </Button>
                        )}
                        {task.status !== 'DONE' ? (
                          <Button type="button" size="sm" onClick={() => updateTaskStatus(task.id, 'DONE')} disabled={isTaskLoading}>
                            <CheckCircle2 className="h-4 w-4" /> Done
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => updateTaskStatus(task.id, 'TODO')} disabled={isTaskLoading}>
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
