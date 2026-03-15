import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Moon, Bell, Lock, Volume2, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { userAPI, settingsAPI } from "../services/apiService";
import toast from "react-hot-toast";

export function SettingsScreen() {
  const userId = parseInt(localStorage.getItem("userId") ?? "0");

  const [settings, setSettings] = useState({
    theme: "light",
    notificationsEnabled: true,
    emailNotifications: true,
    soundEnabled: true,
    dataCollection: true,
    privacy: "public",
  });
  const [loaded, setLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadSettings = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await settingsAPI.get(userId);
      setSettings({
        theme: data.theme ?? "light",
        notificationsEnabled: data.notificationsEnabled ?? true,
        emailNotifications: data.emailNotifications ?? true,
        soundEnabled: data.soundEnabled ?? true,
        dataCollection: data.dataCollection ?? true,
        privacy: data.privacy ?? "public",
      });
    } catch {
      // Use defaults if load fails
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const persist = async (updated: typeof settings) => {
    try {
      await settingsAPI.save(userId, {
        theme: updated.theme,
        notificationsEnabled: updated.notificationsEnabled,
        emailNotifications: updated.emailNotifications,
        soundEnabled: updated.soundEnabled,
        dataCollection: updated.dataCollection,
        privacy: updated.privacy,
      });
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key] };
      persist(updated);
      return updated;
    });
  };

  const handlePrivacyChange = (value: string) => {
    setSettings((prev) => {
      const updated = { ...prev, privacy: value };
      persist(updated);
      return updated;
    });
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await userAPI.deleteUser(userId);
      localStorage.clear();
      window.location.href = "/";
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
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

      {!loaded ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading settings...</div>
      ) : (
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
                  checked={settings.theme === "dark"}
                  onChange={() => {
                    setSettings((prev) => {
                      const updated = { ...prev, theme: prev.theme === "dark" ? "light" : "dark" };
                      persist(updated);
                      return updated;
                    });
                  }}
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
                  checked={settings.notificationsEnabled}
                  onChange={() => handleToggle("notificationsEnabled")}
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
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </Card>
          </div>

          {/* Delete Account Confirmation Dialog */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="w-[95%] rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-destructive">Delete Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {deleteError}
                  </div>
                )}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-900">This action cannot be undone</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Deleting your account will permanently remove all your data,
                        collection history, and personal information.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleDeleteAccount} disabled={deleteLoading} variant="destructive" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteLoading ? "Deleting..." : "Delete Account"}
                  </Button>
                  <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center text-sm text-muted-foreground pb-6">
            <p>Settings are saved automatically</p>
          </div>
        </div>
      )}
    </div>
  );
}

