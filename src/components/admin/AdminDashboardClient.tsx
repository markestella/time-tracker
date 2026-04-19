'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Users, Clock, Coffee } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { UserWithLastEvent } from '@/types';
import { DashboardStats } from './DashboardStats';
import { UserList } from './UserList';
import { RecentMessages } from './RecentMessages';
import { NotificationBell } from './NotificationBell';
import { Message, User, Question } from '@prisma/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { QuoteManager } from './QuoteManager';

type QuestionForAdmin = Pick<Question, 'id' | 'content' | 'answer'>;
export type MessageWithRelations = Message & { 
  user: Pick<User, 'username'>;
  questions: QuestionForAdmin[];
  _count: { questions: number };
};

interface AdminDashboardClientProps {
  user: Session['user'];
  initialUsers: UserWithLastEvent[];
  initialStats: { activeUsers: number; onBreak: number; totalEmployees: number; };
  initialMessages: MessageWithRelations[];
}

export function AdminDashboardClient({ user, initialUsers, initialStats, initialMessages }: AdminDashboardClientProps) {
  const [selectedMessage, setSelectedMessage] = useState<MessageWithRelations | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);

  const handleViewMessage = (message: MessageWithRelations) => {
    setSelectedMessage(message);
  };
  
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const markMessageAsRead = async (messageId: number) => {
    setMessages((currentMessages) => currentMessages.filter((msg) => msg.id !== messageId));
    
    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' });
      router.refresh();
    } catch {
      toast.error("Failed to dismiss message.");
    }
  };
  
  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (selectedMessage && selectedMessage._count.questions === 0) {
        markMessageAsRead(selectedMessage.id);
      }
      setSelectedMessage(null);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!selectedMessage) return;
    setIsLoading(true);

    const unansweredQuestions = selectedMessage.questions.filter(q => !q.answer);
    const allAnsweredInForm = unansweredQuestions.every(q => answers[q.id] && answers[q.id].trim() !== '');

    if (!allAnsweredInForm) {
      toast.error("Please answer all questions before submitting.");
      setIsLoading(false);
      return;
    }

    const payload = unansweredQuestions.map(q => ({ questionId: q.id, answer: answers[q.id] }));

    try {
      await fetch('/api/questions/answer', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success("Answers submitted successfully!");
      
      await markMessageAsRead(selectedMessage.id);
      
      setSelectedMessage(null);
      setAnswers({});
    } catch {
       toast.error("Failed to submit answers.");
    } finally {
       setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Image
            src="/thynetwork-logo.png"
            alt="ThyNetwork Logo"
            width={48}
            height={48}
            priority
          />
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-center text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell onViewMessage={handleViewMessage} />
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
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <DashboardStats title="Employees Clocked In" value={initialStats.activeUsers} icon={Clock} />
        <DashboardStats title="Total Employees" value={initialStats.totalEmployees} icon={Users} />
        <DashboardStats title="Employees On Break" value={initialStats.onBreak} icon={Coffee} />
      </div>
      
      <div className="mb-8">
        <QuoteManager />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UserList initialUsers={initialUsers} />
        </div>
        <div className="lg:col-span-2">
          <RecentMessages messages={messages} onViewMessage={handleViewMessage} />
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Response for {selectedMessage?.user.username}</DialogTitle>
            <DialogDescription>Clocked out at {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto p-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Daily Summary</h4>
              <p className="text-sm text-muted-foreground p-3 border rounded-md">{selectedMessage?.content}</p>
            </div>
            {(selectedMessage?.questions?.length ?? 0) > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Questions</h4>
                <div className="space-y-4">
                  {selectedMessage?.questions.map(q => (
                    <div key={q.id} className="space-y-1">
                      <Label htmlFor={`q-${q.id}`}>{q.content}</Label>
                      {q.answer ? (
                        <p className="text-sm p-3 border rounded-md bg-muted">{q.answer}</p>
                      ) : (
                        <Textarea id={`q-${q.id}`} placeholder="Your answer..." onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(selectedMessage?._count?.questions ?? 0) > 0 && (
            <Button onClick={handleSubmitAnswers} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Answers & Dismiss'}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}