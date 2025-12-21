import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Users, Target, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigate("/app");
    }
  };

  const progressValue = (step / totalSteps) * 100;

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
        {step === 1 && (
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
                <Input placeholder="Enter community name or code" className="h-12" />
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

        {step === 2 && (
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
                <Input type="number" placeholder="e.g., 5" className="h-12" />
              </div>

              <div className="space-y-2">
                <Label>Monthly Food Waste Reduction (kg)</Label>
                <Input type="number" placeholder="e.g., 10" className="h-12" />
              </div>

              <div className="space-y-2">
                <Label>CO₂ Reduction Target (kg)</Label>
                <Input type="number" placeholder="e.g., 50" className="h-12" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
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
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Location Access</p>
                  <p className="text-sm text-muted-foreground">
                    Find nearby recycling centers
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Camera Access</p>
                  <p className="text-sm text-muted-foreground">
                    Scan barcodes and capture waste
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
            </div>
          </div>
        )}
      </div>

      <Button size="lg" className="w-full h-12 mt-6" onClick={handleNext}>
        {step === totalSteps ? "Get Started" : "Continue"}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
