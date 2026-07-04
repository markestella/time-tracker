'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EyeIcon, EyeOffIcon, Info } from 'lucide-react';
import { validatePassword } from '@/lib/utils';
import { PasswordStrength } from './PasswordStrength';
import { BrandMark } from '@/components/brand/BrandMark';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
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
    if (!isPasswordValid) {
      toast.error('Registration Failed', { description: 'PIN does not meet the required criteria.' });
      return;
    }
    if (!passwordsMatch) {
      toast.error('Registration Failed', { description: 'PINs do not match. Please try again.' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { firstName, lastName, username, email, password } = formData;
      const submissionData = { firstName, lastName, username, email, password };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        toast.success('Registration successful!', {
          description: 'You can now log in with your credentials.',
        });
        router.push('/auth/login');
      } else {
        const data = await res.json();
        toast.error('Registration failed', { description: data.error });
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-lg">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <BrandMark />
          <CardTitle className="text-2xl pt-2">Register</CardTitle>
          <CardDescription>Create a new employee account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" required onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" required onChange={handleChange} disabled={isLoading} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" required onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required onChange={handleChange} disabled={isLoading} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="password">PIN</Label>
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
                required
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                disabled={isLoading}
                value={formData.password}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>
            {(isPasswordFocused || formData.password) && !isPasswordValid && (
              <PasswordStrength password={formData.password} />
            )}
          </div>

          {isPasswordValid && (
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm PIN</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                  value={formData.confirmPassword}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
              </div>
              {!passwordsMatch && formData.confirmPassword !== '' && (
                <p className="text-sm text-red-500 mt-1">PINs do not match</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid || !passwordsMatch}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
