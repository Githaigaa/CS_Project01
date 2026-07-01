import { Shield } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";

import { authApi } from "../services/api/auth";
import { getApiErrorMessage } from "../services/api/errors";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

type Step = "email" | "otp" | "password" | "done";

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const clearError = () => setError(null);

  // Step 1 — request OTP
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset({ email });
      setStep("otp");
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP box helpers
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  // Step 2 — verify OTP
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits."); return; }
    setIsSubmitting(true);
    try {
      const { reset_token } = await authApi.verifyPasswordResetOtp({ email, otp: code });
      setResetToken(reset_token);
      setStep("password");
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid or expired code."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 — set new password
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordReset({ reset_token: resetToken, new_password: newPassword });
      setStep("done");
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong. Please start over."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button type="button" onClick={() => onNavigate("landing")} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-semibold">CattleTrace</span>
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">

          {/* Step indicators */}
          {step !== "done" && (
            <div className="flex items-center gap-2 mb-6">
              {(["email", "otp", "password"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    step === s ? "bg-primary text-primary-foreground" :
                    (["email", "otp", "password"].indexOf(step) > i) ? "bg-primary/30 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>{i + 1}</div>
                  {i < 2 && <div className={`h-0.5 flex-1 ${(["email","otp","password"].indexOf(step) > i) ? "bg-primary/40" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-1">Reset Password</h1>
                <p className="text-muted-foreground text-sm">We'll send a 6-digit code to your email.</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input label="Email address" name="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={isSubmitting} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send Code"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <button type="button" className="text-primary hover:underline" onClick={() => onNavigate("login")}>Log in</button>
                </p>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-1">Enter Code</h1>
                <p className="text-muted-foreground text-sm">
                  We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
                </p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      disabled={isSubmitting}
                      className="w-11 h-14 text-center text-xl font-semibold border border-input rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  ))}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || otp.join("").length < 6}>
                  {isSubmitting ? "Verifying…" : "Verify Code"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive it?{" "}
                  <button type="button" className="text-primary hover:underline"
                    onClick={() => { setOtp(["","","","","",""]); setStep("email"); clearError(); }}>
                    Resend code
                  </button>
                </p>
              </form>
            </>
          )}

          {/* Step 3: New password */}
          {step === "password" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-1">New Password</h1>
                <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input label="New password" name="new_password" type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required disabled={isSubmitting} />
                <Input label="Confirm new password" name="confirm_password" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required disabled={isSubmitting} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {/* Done */}
          {step === "done" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-1">Password Updated</h1>
                <p className="text-muted-foreground text-sm">Your password has been reset successfully.</p>
              </div>
              <Button className="w-full" onClick={() => onNavigate("login")}>Go to Login</Button>
            </>
          )}

        </Card>
      </div>
    </div>
  );
}
