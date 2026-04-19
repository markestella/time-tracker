'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { toast } from 'sonner';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, Info } from 'lucide-react';
import { validatePassword } from '@/lib/utils';
import { PasswordStrength } from '../auth/PasswordStrength';

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const isPasswordValid = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToUpdate: Record<string, string> = {};
    if (formData.firstName !== user.firstName) dataToUpdate.firstName = formData.firstName;
    if (formData.lastName !== user.lastName) dataToUpdate.lastName = formData.lastName;
    if (formData.username !== user.username) dataToUpdate.username = formData.username;
    if (formData.email !== user.email) dataToUpdate.email = formData.email;

    if (formData.password) {
      if (!isPasswordValid) {
        toast.error('Update Failed', { description: 'New PIN does not meet the security requirements.' });
        return;
      }
      if (!passwordsMatch) {
        toast.error('Update Failed', { description: 'New PINs do not match.' });
        return;
      }
      dataToUpdate.password = formData.password;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      toast.info('No Changes', { description: "You haven't made any changes to your profile." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Profile Updated!', { description: 'Your details have been changed successfully.' });
        router.refresh();
      } else {
        toast.error('Update Failed', { description: data.error });
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={formData.username} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-medium">Change PIN</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="password">New PIN</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <ul className="list-disc pl-4 text-sm space-y-1">
                    <li>Minimum of 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (@$!%*?&)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave blank to keep current PIN"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-auto px-2 py-1 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
          {(isPasswordFocused || formData.password) && !isPasswordValid && (
            <PasswordStrength password={formData.password} />
          )}
        </div>

        {isPasswordValid && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New PIN</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new PIN"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-auto px-2 py-1 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>
            {!passwordsMatch && formData.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">PINs do not match</p>
            )}
          </div>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || (!!formData.password && (!isPasswordValid || !passwordsMatch))}
      >
        {isLoading ? 'Saving Changes...' : 'Save Changes'}
      </Button>
    </form>
  );
}