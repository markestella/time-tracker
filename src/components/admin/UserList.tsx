'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserWithLastEvent } from '@/types';
import { Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddUserForm } from './AddUserForm';
import { User } from '@prisma/client';
import { ActivityHistory } from '../user/ActivityHistory';

type Props = {
  initialUsers: UserWithLastEvent[];
};

export function UserList({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserWithLastEvent | null>(null);
  const router = useRouter();

  const handleUserAdded = (newUser: User) => {
    const newUserWithLastEvent: UserWithLastEvent = { ...newUser, clockEvents: [] };
    setUsers(currentUsers => [newUserWithLastEvent, ...currentUsers]);
    setIsAddUserOpen(false);
    router.refresh();
  };

  const handleDelete = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setUsers(users.filter((user) => user.id !== userId));
      toast.success('User deleted successfully.');
      router.refresh();
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  const getStatus = (user: UserWithLastEvent): { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } => {
    const lastEvent = user.clockEvents[0]?.type;
    if (lastEvent === 'IN' || lastEvent === 'BREAK_END') return { text: 'Clocked In', variant: 'default' };
    if (lastEvent === 'BREAK_START') return { text: 'On Break', variant: 'secondary' };
    return { text: 'Clocked Out', variant: 'outline' };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employee Status</CardTitle>
          <CardDescription>A list of all employees and their current status.</CardDescription>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new employee account. They can change their details later.</DialogDescription>
            </DialogHeader>
            <AddUserForm onUserAdded={handleUserAdded} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const status = getStatus(user);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.username}</TableCell>
                  <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewingUser(user)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the user and all their associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!viewingUser} onOpenChange={(isOpen) => !isOpen && setViewingUser(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingUser?.firstName} {viewingUser?.lastName}&apos;s Activity</DialogTitle>
            <DialogDescription>{viewingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex-grow overflow-hidden">
            <ActivityHistory userId={viewingUser?.id} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}