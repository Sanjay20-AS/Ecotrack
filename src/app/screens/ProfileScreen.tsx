import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { User, Award, TrendingUp, Settings, Bell, HelpCircle, LogOut, ChevronRight, Save, X, Trash2, Trophy } from "lucide-react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import toast from "react-hot-toast";
import { userAPI, wasteAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

export function ProfileScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wasteStats, setWasteStats] = useState({
    totalWaste: 0,
    wasteCount: 0,
  });
  const [editData, setEditData] = useState({
    name: "",
    phoneNumber: "",
    bio: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = localStorage.getItem("user");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Add role from localStorage if not present in user object
        if (userRole && !parsedUser.role) {
          parsedUser.role = userRole;
        }
        setUser(parsedUser);
        setEditData({
          name: parsedUser.name,
          phoneNumber: parsedUser.phoneNumber || "",
          bio: parsedUser.bio || "",
        });
      }

      if (userId) {
        const waste = await wasteAPI.getWasteByUserId(parseInt(userId));
        const totalWaste = waste.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setWasteStats({
          totalWaste: parseFloat(totalWaste.toFixed(1)),
          wasteCount: waste.length,
        });
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    }
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      const updatedUser = await userAPI.updateUser(parseInt(userId), editData);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setError("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      await userAPI.deleteUser(parseInt(userId));
      
      // Wipe ALL localStorage to prevent stale data from showing
      localStorage.clear();
      
      // Force hard redirect to login (avoids back-button showing old screens)
      window.location.href = "/";
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      toast.error("Failed to delete account.");
      console.error(err);
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Waste", value: `${wasteStats.totalWaste}kg`, icon: TrendingUp },
    { label: "Entries", value: wasteStats.wasteCount.toString(), icon: Award },
    { label: "Rank", value: "#2", icon: User },
  ];

  const badges = [
    { name: "Eco Warrior", icon: "🌟" },
    { name: "Zero Waste", icon: "♻️" },
    { name: "Green Leader", icon: "🏆" },
  ];

  const menuItems = [
    { icon: Trophy, label: "Rewards", path: "/app/rewards" },
    { icon: Bell, label: "Notifications", path: "/app/profile/notifications" },
    { icon: Settings, label: "Settings", path: "/app/profile/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/app/help" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <TopBar variant="banner" title="My Profile" />

      <div className="px-6 pt-4 pb-4">
        <div className="bg-[#F1F8E9] rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-white text-[#2E8B57] text-2xl">
                {user?.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-lg font-bold">{user?.name || "User"}</div>
              <div className="text-sm text-foreground/90">{user?.email || ""}</div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-white text-[#2E8B57] border border-[#e6f4ea]">Level 5 Eco Champion</Badge>
                <Badge variant="outline" className="bg-white text-[#2E8B57] border border-[#e6f4ea]">
                  {user?.role === 'DONOR' ? '🎁 Donor' : user?.role === 'COLLECTOR' ? '🚛 Collector' : '👤 User'}
                </Badge>
              </div>
              {user?.community && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-white text-[#2E8B57] border border-[#e6f4ea]">
                    🏘️ {user.community.name}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="w-[95%] rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editData.phoneNumber}
                  onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                  className="h-12"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="w-full p-3 rounded-lg border bg-input-background resize-none"
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="w-[95%] rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">This action cannot be undone</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Deleting your account will permanently remove all your waste tracking data, 
                      achievements, and personal information from our system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {loading ? "Deleting..." : "Delete Account"}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Impact</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-4 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Achievement Badges</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge, idx) => (
              <Card key={idx} className="p-4 text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium">{badge.name}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <Card className="divide-y">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-between p-4 w-full hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Edit Profile</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </Card>
        </div>

        {/* Delete Account & Logout */}
        <div className="space-y-3">
          <button
            className="flex items-center justify-center gap-2 w-full p-4 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-destructive/20"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-5 w-5" />
            <span className="font-medium">Delete Account</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 w-full p-4 text-muted-foreground hover:bg-muted/10 rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}
