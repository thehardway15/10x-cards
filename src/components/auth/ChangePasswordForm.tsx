import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api.utils';

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmNewPassword: '',
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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, newPassword });
    setErrors({
      ...errors,
      newPassword: validatePassword(newPassword),
      confirmNewPassword:
        newPassword !== formData.confirmNewPassword ? 'Passwords do not match' : '',
    });
  };

  const handleConfirmNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmNewPassword = e.target.value;
    setFormData({ ...formData, confirmNewPassword });
    setErrors({
      ...errors,
      confirmNewPassword:
        confirmNewPassword !== formData.newPassword ? 'Passwords do not match' : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError || formData.newPassword !== formData.confirmNewPassword) {
      setErrors({
        newPassword: passwordError,
        confirmNewPassword:
          formData.newPassword !== formData.confirmNewPassword
            ? 'Passwords do not match'
            : '',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success('Password changed successfully');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred while changing the password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Change Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your current password and choose a new one
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <input
            id="currentPassword"
            type="password"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.currentPassword}
            onChange={(e) =>
              setFormData({ ...formData, currentPassword: e.target.value })
            }
            data-testid="current-password-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <input
            id="newPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.newPassword ? 'border-destructive' : ''
            }`}
            value={formData.newPassword}
            onChange={handleNewPasswordChange}
            data-testid="new-password-input"
            required
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
          <input
            id="confirmNewPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.confirmNewPassword ? 'border-destructive' : ''
            }`}
            value={formData.confirmNewPassword}
            onChange={handleConfirmNewPasswordChange}
            data-testid="confirm-new-password-input"
            required
          />
          {errors.confirmNewPassword && (
            <p className="text-sm text-destructive">{errors.confirmNewPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !!errors.newPassword || !!errors.confirmNewPassword}
          data-testid="change-password-button"
        >
          {isLoading ? 'Changing password...' : 'Change password'}
        </Button>
      </form>
    </div>
  );
}