'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Question } from '@prisma/client';
import { format } from 'date-fns';

export function UserNotificationBell() {
  const [notifications, setNotifications] = useState<Question[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/user');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silently handle fetch failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.isReadByUser).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => fetch(`/api/notifications/user/${id}/read`, { method: 'PATCH' }))
      );
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isReadByUser).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Notifications</DialogTitle>
          <DialogDescription>Answers to questions you&apos;ve asked.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {notifications.map((q) => (
            <div key={q.id} className="flex items-start space-x-3 rounded-lg border p-3">
               {!q.isReadByUser && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" title="Unread" />}
               <div className="flex-1 space-y-1">
                 <p className="text-xs text-muted-foreground">{format(new Date(q.createdAt), 'MMMM dd, yyyy')}</p>
                 <p className="text-sm font-semibold">Q: {q.content}</p>
                 <p className="text-sm text-green-600">A: {q.answer}</p>
               </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">No answered questions yet.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}