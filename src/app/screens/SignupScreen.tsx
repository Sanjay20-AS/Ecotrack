import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { userAPI } from "../services/apiService";

export function SignupScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "DONOR",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        ...formData,
        latitude: 12.9716, // Default location
        longitude: 77.5946,
      };

      const user = await userAPI.signup(userData);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id.toString());
      localStorage.setItem("userRole", user.role);
      navigate("/onboarding");
    } catch (err) {
      setError("Signup failed. Email might already exist. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Enter your full name"
              className="pl-11 h-12 bg-input-background"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
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
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
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
          <Label htmlFor="role">Account Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value="DONOR"
                checked={formData.role === "DONOR"}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="sr-only"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                formData.role === "DONOR" 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}>
                <div className="text-center">
                  <span className="font-medium text-gray-900">🎁 Donor</span>
                  <p className="text-xs text-gray-600 mt-1">Log and donate waste items</p>
                </div>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value="COLLECTOR"
                checked={formData.role === "COLLECTOR"}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="sr-only"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                formData.role === "COLLECTOR" 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}>
                <div className="text-center">
                  <span className="font-medium text-gray-900">🚛 Collector</span>
                  <p className="text-xs text-gray-600 mt-1">Collect and manage waste</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
          />
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

        <Button type="submit" size="lg" className="w-full h-12 mt-4" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
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
