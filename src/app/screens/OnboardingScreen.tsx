import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Users, Target, Bell, MapPin, Clock, Truck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import toast from "react-hot-toast";
import { userAPI } from "../services/apiService";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["Morning (6am-12pm)", "Afternoon (12pm-6pm)", "Evening (6pm-9pm)", "Anytime"];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Get role from localStorage
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  
  // Redirect admin away from onboarding
  useEffect(() => {
    if (userRole === "ADMIN") {
      navigate("/admin");
    }
  }, [userRole, navigate]);
  
  // Determine flow type and total steps
  const isCollector = userRole === "COLLECTOR";
  const isDonor = userRole === "DONOR";
  const totalSteps = isCollector ? 4 : 3;
  
  // Donor form state
  const [donorData, setDonorData] = useState({
    communityName: "",
    eWasteGoal: "",
    foodWasteGoal: "",
    co2Goal: "",
    pushNotifications: true,
    locationAccess: true,
    cameraAccess: true,
  });
  
  // Collector form state
  const [collectorData, setCollectorData] = useState({
    serviceArea: localStorage.getItem("operationArea") || "",
    availableDays: [] as string[],
    availableTime: "",
    pushNotifications: true,
    locationAccess: true,
    cameraAccess: true,
  });

  const handleDonorNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleDonorComplete();
    }
  };

  const handleCollectorNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleCollectorComplete();
    }
  };

  const handleDonorComplete = () => {
    navigate("/app");
  };

  const handleCollectorComplete = async () => {
    setLoading(true);
    try {
      // Save collector preferences to backend
      if (userId) {
        await userAPI.updateUser(
          parseInt(userId),
          {
            operationArea: collectorData.serviceArea,
            collectorDays: collectorData.availableDays.join(","),
            collectorTimeSlot: collectorData.availableTime,
          }
        );
      }
      toast.success("🎉 Ready to collect! Let's get started.");
      navigate("/app");
    } catch (error) {
      console.error("Error saving collector preferences:", error);
      toast.error("Failed to save preferences. You can update them later.");
      navigate("/app");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setCollectorData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const progressValue = (step / totalSteps) * 100;
  const nextHandler = isCollector ? handleCollectorNext : handleDonorNext;

  if (!isDonor && !isCollector) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 flex flex-col">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
            Skip
          </Button>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col">
        {/* ==================== DONOR FLOW ==================== */}
        
        {isDonor && step === 1 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Join a Community</h2>
              <p className="text-center text-muted-foreground">
                Connect with like-minded people committed to sustainability
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Search for a community</Label>
                <Input 
                  placeholder="Enter community name or code" 
                  className="h-12"
                  value={donorData.communityName}
                  onChange={(e) => setDonorData({ ...donorData, communityName: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <Button variant="outline" className="w-full h-12">
                Create New Community
              </Button>
            </div>
          </div>
        )}

        {isDonor && step === 2 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Set Your Goals</h2>
              <p className="text-center text-muted-foreground">
                Define your waste reduction targets
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly E-waste Reduction (kg)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 5" 
                  className="h-12"
                  value={donorData.eWasteGoal}
                  onChange={(e) => setDonorData({ ...donorData, eWasteGoal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Monthly Food Waste Reduction (kg)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 10" 
                  className="h-12"
                  value={donorData.foodWasteGoal}
                  onChange={(e) => setDonorData({ ...donorData, foodWasteGoal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>CO₂ Reduction Target (kg)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 50" 
                  className="h-12"
                  value={donorData.co2Goal}
                  onChange={(e) => setDonorData({ ...donorData, co2Goal: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {isDonor && step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
              <p className="text-center text-muted-foreground">
                Get notified about collection events and tips
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get alerts for events and reminders
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5" 
                  checked={donorData.pushNotifications}
                  onChange={(e) => setDonorData({ ...donorData, pushNotifications: e.target.checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Location Access</p>
                  <p className="text-sm text-muted-foreground">
                    Find nearby recycling centers
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5"
                  checked={donorData.locationAccess}
                  onChange={(e) => setDonorData({ ...donorData, locationAccess: e.target.checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Camera Access</p>
                  <p className="text-sm text-muted-foreground">
                    Scan barcodes and capture waste
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5"
                  checked={donorData.cameraAccess}
                  onChange={(e) => setDonorData({ ...donorData, cameraAccess: e.target.checked })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== COLLECTOR FLOW ==================== */}

        {isCollector && step === 1 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to EcoTrack Collector</h2>
              <p className="text-center text-muted-foreground">
                You're now part of our verified collector network
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="text-2xl">📍</div>
                  <div>
                    <p className="font-semibold text-sm">Accept Requests</p>
                    <p className="text-xs text-muted-foreground">Get notified of waste pickup requests in your area</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">🗺️</div>
                  <div>
                    <p className="font-semibold text-sm">Navigate Easily</p>
                    <p className="text-xs text-muted-foreground">Use maps to reach donor locations efficiently</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">📷</div>
                  <div>
                    <p className="font-semibold text-sm">Capture Proof</p>
                    <p className="text-xs text-muted-foreground">Upload photos to confirm waste collection</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <p className="font-semibold text-sm">Track Progress</p>
                    <p className="text-xs text-muted-foreground">Build your collection record and impact statistics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCollector && step === 2 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Where will you collect?</h2>
              <p className="text-center text-muted-foreground text-sm">
                You'll only see pickup requests in your service area
              </p>
            </div>

            <div className="space-y-3 flex-1">
              <div className="space-y-2">
                <Label htmlFor="serviceArea">Primary Service Area</Label>
                <Input 
                  id="serviceArea"
                  placeholder="e.g. South Zone, Anna Nagar, Downtown"
                  className="h-12"
                  value={collectorData.serviceArea}
                  onChange={(e) => setCollectorData({ ...collectorData, serviceArea: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This was set during registration: {localStorage.getItem("operationArea")}.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCollector && step === 3 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">When are you available?</h2>
              <p className="text-center text-muted-foreground text-sm">
                We'll prioritize requests that match your availability
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Days Available</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        collectorData.availableDays.includes(day)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {collectorData.availableDays.length} days selected
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot">Preferred Time</Label>
                <select
                  id="timeSlot"
                  value={collectorData.availableTime}
                  onChange={(e) => setCollectorData({ ...collectorData, availableTime: e.target.value })}
                  className="w-full h-12 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-primary focus:ring-primary bg-white"
                >
                  <option value="">Select time preference</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">We'll match you with requests during these hours</p>
              </div>
            </div>
          </div>
        )}

        {isCollector && step === 4 && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Stay on top of pickups</h2>
              <p className="text-center text-muted-foreground text-sm">
                Enable notifications and permissions to get started
              </p>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new pickups are available nearby
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5"
                  checked={collectorData.pushNotifications}
                  onChange={(e) => setCollectorData({ ...collectorData, pushNotifications: e.target.checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Location Access</p>
                  <p className="text-sm text-muted-foreground">
                    Navigate to donor locations easily
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5"
                  checked={collectorData.locationAccess}
                  onChange={(e) => setCollectorData({ ...collectorData, locationAccess: e.target.checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Camera Access</p>
                  <p className="text-sm text-muted-foreground">
                    Capture collection completion photos
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5"
                  checked={collectorData.cameraAccess}
                  onChange={(e) => setCollectorData({ ...collectorData, cameraAccess: e.target.checked })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Button 
        size="lg" 
        className="w-full h-12 mt-6" 
        onClick={nextHandler}
        disabled={loading}
      >
        {step === totalSteps ? "Start Collecting! 🚀" : "Continue"}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
