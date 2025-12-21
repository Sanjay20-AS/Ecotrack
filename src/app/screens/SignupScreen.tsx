import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function SignupScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-background overflow-y-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">ecotrack</h1>
        </div>
        <h2 className="text-xl font-semibold">Create Account</h2>
        <p className="text-sm text-muted-foreground">Join the sustainability movement</p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4 max-w-md mx-auto w-full">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Enter your full name"
              className="pl-11 h-12 bg-input-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-11 h-12 bg-input-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-11 h-12 bg-input-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="pl-11 pr-11 h-12 bg-input-background"
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

        <div className="flex items-start gap-2 mt-2">
          <input type="checkbox" id="terms" className="mt-1" />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full h-12 mt-4">
          Sign Up
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:underline font-medium">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
