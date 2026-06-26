import { Loader2, Shield } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { ApiUserRole } from "../lib/api/types";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage, getApiFieldErrors } from "../services/api/errors";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input, Select } from "../components/Input";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

const REGISTRATION_ROLES: { value: ApiUserRole; label: string }[] = [
  { value: "farmer", label: "Farmer" },
  { value: "buyer", label: "Buyer" },
  { value: "vet", label: "Veterinarian" },
  { value: "abattoir", label: "Abattoir" },
];

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ApiUserRole>("farmer");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({ username, email, password, role });
      onNavigate("dashboard");
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err, "Unable to create your account. Please review the form and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-semibold">CattleTrace</span>
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Start managing livestock traceability records.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Registration failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              disabled={isSubmitting}
              error={fieldErrors.username}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting}
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isSubmitting}
              error={fieldErrors.password}
            />
            <Select
              label="Role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as ApiUserRole)}
              disabled={isSubmitting}
              error={fieldErrors.role}
            >
              {REGISTRATION_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => onNavigate("login")}
              disabled={isSubmitting}
            >
              Sign in
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
