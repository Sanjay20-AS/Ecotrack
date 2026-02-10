import { useState } from "react";
import { ArrowLeft, Moon, Bell, Lock, Volume2, Eye } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export function SettingsScreen() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    privacy: "public",
    soundEnabled: true,
    dataCollection: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));
  };

  const handlePrivacyChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      privacy: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <Link to="/app/profile" className="hover:opacity-80">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Display Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Display
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="cursor-pointer flex-1">
                Dark Mode
              </Label>
              <input
                id="darkMode"
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => handleToggle("darkMode")}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* Notification Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer flex-1">
                Push Notifications
              </Label>
              <input
                id="notifications"
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggle("notifications")}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotif" className="cursor-pointer flex-1">
                  Email Notifications
                </Label>
                <input
                  id="emailNotif"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="cursor-pointer flex-1 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Sound
                </Label>
                <input
                  id="sound"
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={() => handleToggle("soundEnabled")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Privacy Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy
          </h2>
          <Card className="p-4 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Profile Visibility</Label>
              <div className="space-y-2">
                {[
                  { value: "public", label: "Public - Anyone can see your profile" },
                  { value: "friends", label: "Friends Only - Only friends can see" },
                  { value: "private", label: "Private - Only you can see" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={settings.privacy === option.value}
                      onChange={(e) => handlePrivacyChange(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Data & Privacy */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="dataCollection" className="cursor-pointer">
                  Allow Data Collection
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Help us improve the app with anonymous usage data
                </p>
              </div>
              <input
                id="dataCollection"
                type="checkbox"
                checked={settings.dataCollection}
                onChange={() => handleToggle("dataCollection")}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h2>
          <Card className="p-4 space-y-3 border-destructive/20 bg-destructive/5">
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">
              Reset App
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              Delete Account
            </Button>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground pb-6">
          <p>Settings are saved automatically</p>
        </div>
      </div>
    </div>
  );
}
