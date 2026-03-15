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
    <div className="flex flex-col min-h-screen px-6 py-12 bg-background">
      <div className="flex flex-col items-center mb-10 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary">EcoTrack</h1>
        </div>
        <h2 className="text-xl font-semibold">Reset Password</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          {step === "email" && "Enter your account email to reset your password"}
          {step === "reset" && "Create a new password for your account"}
          {step === "done" && "Your password has been updated"}
        </p>
      </div>

      <div className="max-w-md mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
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
                  className="pl-11 h-12 bg-input-background"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full h-12 mt-2">
              Continue
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
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
                  className="pl-11 pr-11 h-12 bg-input-background"
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
                  className="pl-11 pr-11 h-12 bg-input-background"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full h-12 mt-2" disabled={loading}>
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
            <Button size="lg" className="w-full h-12" onClick={() => navigate("/")}>
              Back to Login
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
