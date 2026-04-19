'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/utils';
import { PasswordStrength } from '../auth/PasswordStrength';
import { User } from '@prisma/client';

interface AddUserFormProps {
  onUserAdded: (newUser: User) => void;
}

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(formData.password)) {
      toast.error('Creation Failed', { description: 'Password does not meet the required criteria.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newUser = await res.json();
        toast.success('User created successfully!');
        onUserAdded(newUser);
      } else {
        const data = await res.json();
        toast.error('Creation Failed', { description: data.error });
      }
    } catch {
       toast.error('An error occurred.');
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" required onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" required onChange={handleChange} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" required onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">PIN (Temporary Password)</Label>
        <Input id="password" type="password" required onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} onChange={handleChange} />
        {(isPasswordFocused || formData.password) && <PasswordStrength password={formData.password} />}
      </div>
      <Button type="submit" className="w-full mt-2" disabled={isLoading}>
        {isLoading ? 'Creating User...' : 'Create User'}
      </Button>
    </form>
  );
}