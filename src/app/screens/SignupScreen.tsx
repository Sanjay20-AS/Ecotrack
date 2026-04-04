import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
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
    // Collector-specific fields
    organizationName: "",
    reasonForCollecting: "",
    vehicleType: "",
    operationArea: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    // Collector-specific validation
    if (formData.role === "COLLECTOR") {
      if (!formData.reasonForCollecting.trim()) {
        setError("Please tell us why you want to collect waste");
        return;
      }
      if (!formData.vehicleType) {
        setError("Please select your vehicle type");
        return;
      }
      if (!formData.operationArea.trim()) {
        setError("Please enter your area of operation");
        return;
      }
      if (formData.reasonForCollecting.trim().length < 20) {
        setError("Please provide at least 20 characters for your reason");
        return;
      }
    }

    setLoading(true);

    try {
      const userData = {
        ...formData,
        latitude: 11.0168, // Default location
        longitude: 76.9558,
      };

      const user = await userAPI.signup(userData);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id.toString());
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("accountStatus", user.accountStatus || "ACTIVE");
      if (user.token) localStorage.setItem("token", user.token);
      navigate("/onboarding");
    } catch (err) {
      setError("Signup failed. Email might already exist. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="flex flex-col items-center mb-6 mt-2 text-center">
        <div className="w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center mb-3">
          <Leaf className="h-8 w-8 text-primary-foreground" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground mt-1">Join the sustainability movement</p>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col pb-6">
        <div className="rounded-3xl border border-border/60 bg-card/90 backdrop-blur-md p-6 shadow-xl shadow-black/[0.06]">
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm">
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
              className="pl-11 bg-input-background"
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
              className="pl-11 bg-input-background"
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
              className="pl-11 bg-input-background"
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
              className="pl-11 pr-11 bg-input-background"
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

        {/* ── Collector-specific fields ── */}
        {formData.role === "COLLECTOR" && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div className="text-sm font-medium text-blue-900">Collector Application</div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name (Optional)</Label>
              <Input
                id="organization"
                placeholder="e.g. GreenNGO, City Municipality, or leave blank if independent"
                className="bg-input-background"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />
            </div>

            {/* Reason for Collecting */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Tell us about yourself <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                placeholder="e.g. I work at GreenNGO handling e-waste collection, I'm a municipal worker covering South Zone, I'm a volunteer with a vehicle and want to help my local community with waste pickups..."
                className="w-full h-24 px-3 py-2 rounded-md border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 resize-none"
                value={formData.reasonForCollecting}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData({ ...formData, reasonForCollecting: e.target.value });
                  }
                }}
                maxLength={300}
              />
              <p className="text-xs text-gray-500">{formData.reasonForCollecting.length}/300 characters</p>
              <p className="text-xs text-gray-500">Include your organization (if any), your area, and what motivates you to help 💚</p>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                <SelectTrigger className="h-11 rounded-xl bg-input-background">
                  <SelectValue placeholder="Select your vehicle type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="BICYCLE">🚲 Bicycle</SelectItem>
                  <SelectItem value="MOTORBIKE">🛵 Motorbike</SelectItem>
                  <SelectItem value="CAR">🚗 Car</SelectItem>
                  <SelectItem value="TRUCK">🚛 Truck</SelectItem>
                  <SelectItem value="OTHER">🔧 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area of Operation */}
            <div className="space-y-2">
              <Label htmlFor="area">
                Area of Operation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                placeholder="e.g. South Zone, Anna Nagar, Coimbatore"
                className="bg-input-background"
                value={formData.operationArea}
                onChange={(e) => setFormData({ ...formData, operationArea: e.target.value })}
                required
              />
            </div>

            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600">
                We just want to know a little about you before approving your account. No formal experience needed! ✓
              </p>
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={() => setShowTos(true)}
              className="text-primary hover:underline font-medium"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:underline font-semibold">
            Login
          </Link>
        </p>
      </form>
        </div>
      </div>

      {/* ── Terms of Service Dialog ── */}
      <Dialog open={showTos} onOpenChange={setShowTos}>
        <DialogContent className="max-w-lg w-full max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              📋 Terms of Service
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2 text-sm text-muted-foreground space-y-4 overflow-y-auto">
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">Effective Date: January 1, 2026</p>

              <section>
                <h3 className="font-semibold text-foreground mb-1">1. Acceptance of Terms</h3>
                <p>By registering for and using EcoTrack, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">2. Description of Service</h3>
                <p>EcoTrack is a waste management platform that connects individuals and organizations (Donors) with waste collectors. The platform facilitates the logging, tracking, and collection of waste including e-waste, food waste, and other recyclable materials.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">3. User Accounts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>You must provide accurate information during signup.</li>
                  <li>You are responsible for maintaining the security of your account credentials.</li>
                  <li>Collector accounts require admin approval before activation.</li>
                  <li>EcoTrack reserves the right to suspend or terminate accounts for violations.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">4. Acceptable Use</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Submit false or misleading waste reports.</li>
                  <li>Use the platform for illegal waste disposal.</li>
                  <li>Interfere with or disrupt the platform's infrastructure.</li>
                  <li>Harass or engage in abusive behavior toward other users.</li>
                  <li>Upload images unrelated to waste collection activities.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">5. Collector Obligations</h3>
                <p>Collectors must:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Only claim pickups they intend to complete.</li>
                  <li>Arrive within the scheduled timeframe.</li>
                  <li>Upload a genuine collection photo upon completion.</li>
                  <li>Provide accurate GPS location during collection.</li>
                  <li>Handle waste responsibly and in compliance with local regulations.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">6. Content & Photos</h3>
                <p>By uploading photos to EcoTrack, you grant us a non-exclusive, royalty-free license to use those images solely for operational purposes — such as verifying collections, displaying pickup status to donors, and improving AI classification models.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">7. Rewards & Points</h3>
                <p>EcoTrack points and badges are virtual and have no monetary value unless explicitly redeemed through the in-app reward catalogue. EcoTrack reserves the right to modify or discontinue the rewards program at any time.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">8. Disclaimer of Warranties</h3>
                <p>EcoTrack is provided "as is" without warranty of any kind. We do not guarantee uninterrupted availability or that all waste requests will be fulfilled by collectors.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">9. Limitation of Liability</h3>
                <p>EcoTrack shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including disputes between donors and collectors.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">10. Changes to Terms</h3>
                <p>We may update these terms at any time. Continued use of EcoTrack after changes constitutes your acceptance of the revised terms.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">11. Contact</h3>
                <p>For questions about these terms, contact us at <span className="text-primary">support@ecotrack.app</span></p>
              </section>
            </div>
          </ScrollArea>
          <div className="pt-3 border-t">
            <Button className="w-full" onClick={() => { setAgreeToTerms(true); setShowTos(false); }}>
              I Agree to Terms of Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Privacy Policy Dialog ── */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-lg w-full max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              🔒 Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2 text-sm text-muted-foreground space-y-4 overflow-y-auto">
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">Effective Date: January 1, 2026</p>

              <section>
                <h3 className="font-semibold text-foreground mb-1">1. Information We Collect</h3>
                <p>When you create an account and use EcoTrack, we collect:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li><strong>Account Information:</strong> Name, email address, phone number.</li>
                  <li><strong>Location Data:</strong> GPS coordinates when logging waste or completing pickups.</li>
                  <li><strong>Waste Records:</strong> Type, quantity, description, and photos of waste you report.</li>
                  <li><strong>Usage Data:</strong> Pages visited, features used, and interaction data to improve the platform.</li>
                  <li><strong>Device Information:</strong> Browser type, device model, and IP address.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">2. How We Use Your Information</h3>
                <p>We use your data to:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Match waste donations with nearby collectors.</li>
                  <li>Send you notifications about your pickups and account status.</li>
                  <li>Generate anonymized statistics for platform analytics.</li>
                  <li>Improve our AI waste classification system.</li>
                  <li>Prevent fraud and maintain platform security.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">3. Location Data</h3>
                <p>Location data is used solely to:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Help collectors find your waste pickup location.</li>
                  <li>Verify that collection occurred at the correct address.</li>
                  <li>Show you nearby waste disposal facilities on the map.</li>
                </ul>
                <p className="mt-1">Your precise location is never publicly displayed. It is shared only with the assigned collector for active pickups.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">4. Photo Data</h3>
                <p>Photos you upload of waste items are stored securely on our servers. They are used to verify waste type and collection completion. Photos may be reviewed by our admin team and used to train our AI waste classifier, with your category data anonymized.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">5. Data Sharing</h3>
                <p>We do <strong>not</strong> sell your personal data. We share data only:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>With assigned collectors — only the pickup address and waste description.</li>
                  <li>With platform admins for account management.</li>
                  <li>When required by law or to protect the safety of users.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">6. Data Retention</h3>
                <p>We retain your data for as long as your account is active. When you delete your account, all personal data including waste records, messages, and profile information is permanently deleted within 30 days.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">7. Security</h3>
                <p>Passwords are stored using BCrypt hashing. API communication is secured with JWT tokens. We use HTTPS and apply security best practices to protect your data.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">8. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Access the personal data we hold about you.</li>
                  <li>Correct inaccurate data via your profile settings.</li>
                  <li>Delete your account and all associated data.</li>
                  <li>Opt out of non-essential data collection via Settings.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">9. Cookies & Local Storage</h3>
                <p>EcoTrack uses browser local storage to keep you logged in between sessions. We do not use third-party tracking cookies.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">10. Contact</h3>
                <p>For privacy questions or data requests, contact us at <span className="text-primary">privacy@ecotrack.app</span></p>
              </section>
            </div>
          </ScrollArea>
          <div className="pt-3 border-t">
            <Button className="w-full" onClick={() => { setAgreeToTerms(true); setShowPrivacy(false); }}>
              I Agree to Privacy Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
