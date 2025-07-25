import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface User {
  email: string;
}

export function TopBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    fetch('/api/auth/me', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsAuthenticated(true);
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserEmail('');
      });
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">FlashAI</span>
          </a>
          
          {/* Show navigation links only for authenticated users */}
          {isAuthenticated && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                href="/generate"
                className="transition-colors hover:text-foreground/80"
              >
                Generate
              </a>
              <a
                href="/account"
                className="transition-colors hover:text-foreground/80"
              >
                Account
              </a>
            </nav>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <a href="/login">
                <Button variant="ghost">Sign in</Button>
              </a>
              <a href="/register">
                <Button>Sign up</Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 