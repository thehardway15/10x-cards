interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError extends Error {
  status?: number;
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;

  // Add Authorization header if not skipping auth
  if (!skipAuth) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "API request failed") as ApiError;
    error.status = response.status;

    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    throw error;
  }

  // Update token if provided in response
  if (data.token) {
    localStorage.setItem("auth_token", data.token);
  }

  return data;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function getUser(): unknown | null {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

export function clearAuth(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
}

// Helper functions for common API operations
export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<ApiOptions, "method">) => api<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
    api<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
    api<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(data) }),

  delete: <T>(endpoint: string, options?: Omit<ApiOptions, "method">) =>
    api<T>(endpoint, { ...options, method: "DELETE" }),
};
