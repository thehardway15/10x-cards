import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      // Store JWT token in localStorage
      localStorage.setItem("auth_token", data.token);

      // Store user data in localStorage for convenience
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to generate page on success
      window.location.href = "/generate";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your email to sign in to your account</p>
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
            data-testid="login-email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            data-testid="login-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-button">
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
