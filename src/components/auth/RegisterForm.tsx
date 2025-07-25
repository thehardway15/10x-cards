import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must contain at least one letter and one number';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    setErrors({
      ...errors,
      password: validatePassword(password),
      confirmPassword:
        password !== formData.confirmPassword ? 'Passwords do not match' : '',
    });
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setFormData({ ...formData, confirmPassword });
    setErrors({
      ...errors,
      confirmPassword:
        confirmPassword !== formData.password ? 'Passwords do not match' : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    const passwordError = validatePassword(formData.password);
    if (passwordError || formData.password !== formData.confirmPassword) {
      setErrors({
        password: passwordError,
        confirmPassword:
          formData.password !== formData.confirmPassword
            ? 'Passwords do not match'
            : '',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Show success message
      toast.success('Registration successful! Redirecting to login...');

      // Wait a bit for the toast to be visible
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to create your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <input
            id="password"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.password ? 'border-destructive' : ''
            }`}
            value={formData.password}
            onChange={handlePasswordChange}
            required
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <input
            id="confirmPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.confirmPassword ? 'border-destructive' : ''
            }`}
            value={formData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !!errors.password || !!errors.confirmPassword}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
} 