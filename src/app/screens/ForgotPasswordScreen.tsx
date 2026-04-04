import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { userAPI } from "../services/apiService";
import toast from "react-hot-toast";

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await userAPI.resetPassword(email, newPassword);
      setStep("done");
      toast.success("Password reset successful!");
    } catch (err: any) {
      const msg = err?.data?.error || "Reset failed. Please check your email and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center mb-8 mt-6 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center mb-4">
          <Leaf className="h-9 w-9 text-primary-foreground" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
          {step === "email" && "Enter your account email to reset your password"}
          {step === "reset" && "Create a new password for your account"}
          {step === "done" && "Your password has been updated"}
        </p>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-md p-6 shadow-xl shadow-black/[0.06]">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm mb-4">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 bg-input-background"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-2">
              Continue
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="bg-muted/60 rounded-2xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 border border-border/50">
              <Mail className="h-4 w-4" />
              {email}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-11 pr-11 bg-input-background"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 pr-11 bg-input-background"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="text-sm text-primary hover:underline text-center"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <p className="text-center text-muted-foreground">
              You can now log in with your new password.
            </p>
            <Button size="lg" className="w-full" onClick={() => navigate("/")}>
              Back to Login
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
