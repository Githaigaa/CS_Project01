import { Shield } from "lucide-react";
import { useState, type FormEvent } from "react";

import { authApi } from "../services/api/auth";
import { getApiErrorMessage } from "../services/api/errors";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

interface ResetPasswordPageProps {
  uid: string;
  token: string;
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ uid, token, onNavigate }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordReset({ uid, token, new_password: newPassword });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid or expired reset link. Please request a new one."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
            <h1 className="text-2xl font-semibold mb-2">Set New Password</h1>
            <p className="text-muted-foreground">Choose a strong password for your account.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription>
                  Your password has been reset successfully. You can now log in.
                </AlertDescription>
              </Alert>
              <Button type="button" className="w-full" onClick={() => onNavigate("login")}>
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                name="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
              <Input
                label="Confirm new password"
                name="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
