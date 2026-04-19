'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, LogIn, LogOut } from 'lucide-react';
import { MessageWithRelations } from './AdminDashboardClient';

interface NotificationData {
  user: { username: string };
  content: string;
  isRead?: boolean;
  createdAt?: Date;
}

interface Notification {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT_MESSAGE';
  data: NotificationData;
  createdAt: Date;
}

interface NotificationBellProps {
  onViewMessage: (message: MessageWithRelations) => void;
}

export function NotificationBell({ onViewMessage }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch {
        // Silently handle fetch failure
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'CLOCK_OUT_MESSAGE') {
      onViewMessage(notification.data as MessageWithRelations);
      setIsOpen(false);
    }
  };
  
  const unreadCount = notifications.filter(
    (n) => n.type === 'CLOCK_OUT_MESSAGE' && !n.data.isRead
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Recent employee activity and messages.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start space-x-4 rounded-lg border p-3 ${
                notification.type === 'CLOCK_OUT_MESSAGE' ? 'cursor-pointer hover:bg-accent' : ''
              }`}
            >
              <div className="relative mt-1">
                {notification.type === 'CLOCK_IN' && (
                  <LogIn className="h-4 w-4 text-green-500" />
                )}
                {notification.type === 'CLOCK_OUT_MESSAGE' && (
                  <>
                    <LogOut className="h-4 w-4 text-destructive" />
                    {!notification.data.isRead && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-sky-500" title="Unread"/>
                    )}
                  </>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{notification.data.user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{notification.data.content}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">No notifications yet.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}