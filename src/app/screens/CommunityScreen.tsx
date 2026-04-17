import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Users, Trophy, TrendingUp, Award, Plus, Search, UserPlus, LogOut, Medal, Crown, Star, Calendar } from "lucide-react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { communityAPI, userAPI, eventsAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

type DetailTab = "members" | "leaderboard";

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  creator: any;
}

interface CommunityStats {
  memberCount: number;
  totalWasteLogged: number;
  communityName: string;
  category: string;
}

interface CommunityMember {
  id: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  role: string;
  totalWaste: number;
  wasteEntries: number;
  rank: number;
  joinedAt: string;
}

export function CommunityScreen() {
  const [userCommunity, setUserCommunity] = useState<Community | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("members");
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [events, setEvents] = useState<any[]>([]);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    category: "GENERAL"
  });

  useEffect(() => {
    loadUserCommunity();
    loadEvents();
  }, []);

  const loadUserCommunity = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        // Get fresh user data from API to ensure we have current community status
        const freshUserData = await userAPI.getUserById(parseInt(userId));
        
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(freshUserData));
        
        if (freshUserData.community) {
          setUserCommunity(freshUserData.community);
          await loadCommunityStats(freshUserData.community.id);
        }
      } else {
        // Fallback to localStorage if userId not found
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.community) {
            setUserCommunity(user.community);
            await loadCommunityStats(user.community.id);
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load user community:", err);
      // Fallback to localStorage on API error
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.community) {
            setUserCommunity(user.community);
            await loadCommunityStats(user.community.id);
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
      }
      setLoading(false);
    }
  };

  const loadCommunityStats = async (communityId: number) => {
    try {
      const stats = await communityAPI.getCommunityStats(communityId);
      setCommunityStats(stats);
    } catch (err) {
      console.error("Failed to load community stats:", err);
    }
  };

  const loadCommunityMembers = async (communityId: number) => {
    try {
      const response = await communityAPI.getCommunityMembers(communityId);
      setCommunityMembers(response.members || []);
    } catch (err) {
      console.error("Failed to load community members:", err);
      setError("Failed to load community members");
      toast.error("Failed to load community members.");
    }
  };

  const loadLeaderboard = async (communityId: number) => {
    try {
      const response = await communityAPI.getCommunityLeaderboard(communityId);
      setLeaderboard(response.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      setError("Failed to load leaderboard");
      toast.error("Failed to load leaderboard.");
    }
  };

  const loadEvents = async () => {
    try {
      let location = localStorage.getItem("userLocation") || "Coimbatore";
      const eventsData = await eventsAPI.getUpcomingEventsByLocation(location);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error("Failed to load events:", err);
      try {
        const eventsData = await eventsAPI.getUpcomingEvents();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch {
        setEvents([]);
      }
    }
  };

  const handleShowMembers = () => {
    if (userCommunity) {
      loadCommunityMembers(userCommunity.id);
      setShowMembersDialog(true);
    }
  };

  // Load both members and leaderboard for inline display
  useEffect(() => {
    if (userCommunity && !detailsLoaded) {
      loadCommunityMembers(userCommunity.id);
      loadLeaderboard(userCommunity.id);
      setDetailsLoaded(true);
    }
  }, [userCommunity]);

  const handleShowLeaderboard = () => {
    if (userCommunity) {
      loadLeaderboard(userCommunity.id);
      setShowLeaderboardDialog(true);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  const loadAvailableCommunities = async () => {
    try {
      const communities = await communityAPI.getAllCommunities();
      setAvailableCommunities(communities);
    } catch (err) {
      console.error("Failed to load communities:", err);
      setError("Failed to load communities");
      toast.error("Failed to load communities.");
    }
  };

  const handleSearchCommunities = async () => {
    if (!searchQuery.trim()) {
      await loadAvailableCommunities();
      return;
    }
    
    try {
      const communities = await communityAPI.searchCommunities(searchQuery);
      setAvailableCommunities(communities);
    } catch (err) {
      console.error("Failed to search communities:", err);
      setError("Failed to search communities");
      toast.error("Failed to search communities.");
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not found");
      return;
    }

    // Check if user is already in a community
    if (userCommunity) {
      setError("You're already in a community! Please leave your current community before creating a new one.");
      setShowCreateDialog(false);
      return;
    }

    try {
      const communityData = {
        ...createFormData,
        creatorId: parseInt(userId)
      };

      const newCommunity = await communityAPI.createCommunity(communityData);
      
      // Update user data in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        user.community = newCommunity;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setUserCommunity(newCommunity);
      await loadCommunityStats(newCommunity.id);
      setShowCreateDialog(false);
      setSuccess("Community created successfully!");
      toast.success("Community created successfully!");
      
      // Reset form
      setCreateFormData({
        name: "",
        description: "",
        category: "GENERAL"
      });
    } catch (err: any) {
      console.error("Failed to create community:", err);
      
      // Handle specific error for user already in community
      if (err.message?.includes("already in a community")) {
        setError("You're already in a community! Please leave your current community before creating a new one.");
        toast.error("You're already in a community!");
        setShowCreateDialog(false);
        // Refresh user data to update UI
        await loadUserCommunity();
      } else {
        setError(err.message || "Failed to create community");
        toast.error(err.message || "Failed to create community.");
      }
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not found");
      return;
    }

    try {
      const response = await communityAPI.joinCommunity(communityId, parseInt(userId));
      
      // Update user data in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        user.community = response.community;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setUserCommunity(response.community);
      await loadCommunityStats(response.community.id);
      setShowJoinDialog(false);
      setSuccess("Successfully joined community!");
      toast.success("Successfully joined community!");
    } catch (err: any) {
      console.error("Failed to join community:", err);
      
      // Handle specific error for user already in community
      if (err.message?.includes("already in a community")) {
        setError("You're already in a community! Please leave your current community before joining a new one.");
        toast.error("You're already in a community!");
        setShowJoinDialog(false);
        // Refresh user data to update UI
        await loadUserCommunity();
      } else {
        setError(err.message || "Failed to join community");
        toast.error(err.message || "Failed to join community.");
      }
    }
  };

  const handleLeaveCommunity = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !userCommunity) return;

    try {
      await communityAPI.leaveCommunity(userCommunity.id, parseInt(userId));
      
      // Update user data in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        user.community = null;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setUserCommunity(null);
      setCommunityStats(null);
      setSuccess("Successfully left community!");
      toast.success("Successfully left community!");
    } catch (err: any) {
      console.error("Failed to leave community:", err);
      setError(err.message || "Failed to leave community");
      toast.error(err.message || "Failed to leave community.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading community...</div>
      </div>
    );
  }

  // If user doesn't have a community, show join/create UI
  if (!userCommunity) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <TopBar variant="banner" title="Community" subtitle="Join groups and local eco action" />

        <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
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

          {/* Action Cards */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Find Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join an existing community in your area
              </p>
              <Button 
                onClick={() => {
                  setShowJoinDialog(true);
                  loadAvailableCommunities();
                }}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Communities
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Plus className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your own sustainability community
              </p>
              <Button 
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </Card>
          </div>
        </div>

        {/* Join Community Dialog */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent className="mx-4">
            <DialogHeader>
              <DialogTitle>Join a Community</DialogTitle>
              <DialogDescription>
                Browse and join existing communities to connect with other eco-warriors.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Communities</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter community name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSearchCommunities}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableCommunities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No communities found</p>
                ) : (
                  availableCommunities.map((community) => (
                    <Card key={community.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{community.name}</h4>
                          <p className="text-sm text-muted-foreground">{community.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <Badge variant="outline">{community.category}</Badge>
                            <span className="text-muted-foreground">
                              {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleJoinCommunity(community.id)}
                        >
                          Join
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Community Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="mx-4">
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
              <DialogDescription>
                Start your own sustainability community and invite others to join your mission.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div className="space-y-2">
                <Label>Community Name</Label>
                <Input
                  placeholder="Enter community name..."
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Describe your community..."
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={createFormData.category}
                  onChange={(e) => setCreateFormData({...createFormData, category: e.target.value})}
                >
                  <option value="GENERAL">General</option>
                  <option value="RECYCLING">Recycling</option>
                  <option value="COMPOSTING">Composting</option>
                  <option value="E-WASTE">E-waste</option>
                </select>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If user has a community, show community dashboard
  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title={userCommunity.name} subtitle={userCommunity.description} />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
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

        {/* Community Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Community Impact</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats?.totalWasteLogged || 0}kg</p>
              <p className="text-xs text-muted-foreground">Waste Logged</p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats?.memberCount || 0}</p>
              <p className="text-xs text-muted-foreground">Active Members</p>
            </Card>
          </div>
        </div>

        {/* Community Details – Toggle Members / Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Community Details</h2>

          {/* Toggle Buttons */}
          <div className="flex rounded-xl bg-muted p-1 mb-4">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                detailTab === "members"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDetailTab("members")}
            >
              <Users className="h-4 w-4" />
              Members
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {communityMembers.length}
              </span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                detailTab === "leaderboard"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDetailTab("leaderboard")}
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </button>
          </div>

          {/* Members Panel */}
          {detailTab === "members" && (
            <div className="space-y-3">
              {communityMembers.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading members...</p>
                </Card>
              ) : (
                communityMembers.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {member.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Leaderboard Panel */}
          {detailTab === "leaderboard" && (
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading leaderboard...</p>
                </Card>
              ) : (
                leaderboard.map((entry) => (
                  <Card key={entry.id} className={`p-4 ${entry.rank <= 3 ? "border-yellow-200 bg-yellow-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {getRankIcon(entry.rank)}
                          <span className="font-bold text-lg">#{entry.rank}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {entry.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{entry.totalWaste}kg</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.wasteEntries} entries
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        {events && events.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {events.map((event, idx) => (
                <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {event.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Message */}
        <Card className="p-6 text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keep Growing!</h3>
          <p className="text-sm text-muted-foreground">
            Your community is making a real impact. Keep logging waste and inspiring others!
          </p>
        </Card>
      </div>
    </div>
  );
}
