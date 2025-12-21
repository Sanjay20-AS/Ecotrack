import { Users, Trophy, TrendingUp, Award } from "lucide-react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";

export function CommunityScreen() {
  const leaderboard = [
    { name: "Alex Chen", points: 1250, avatar: "AC", rank: 1 },
    { name: "Sarah J.", points: 1180, avatar: "SJ", rank: 2 },
    { name: "Mike Wilson", points: 1050, avatar: "MW", rank: 3 },
    { name: "Emily Davis", points: 980, avatar: "ED", rank: 4 },
    { name: "John Smith", points: 920, avatar: "JS", rank: 5 },
  ];

  const challenges = [
    { title: "Zero Food Waste Week", progress: 65, days: "3 days left" },
    { title: "E-waste Collection Drive", progress: 80, days: "5 days left" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Green Valley Community</h1>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>124 Members</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span>Rank #12</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Community Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Community Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">450kg</p>
              <p className="text-xs text-muted-foreground">Waste Reduced</p>
            </Card>
            <Card className="p-4 text-center">
              <Award className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <select className="text-sm border rounded-lg px-3 py-1">
              <option>This Month</option>
              <option>This Week</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="space-y-3">
            {leaderboard.map((user, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                    {user.rank}
                  </div>
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.points} points</p>
                  </div>
                  {user.rank <= 3 && (
                    <Trophy className={`h-6 w-6 ${
                      user.rank === 1 ? 'text-yellow-500' :
                      user.rank === 2 ? 'text-gray-400' :
                      'text-amber-600'
                    }`} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Challenges */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Active Challenges</h2>
          <div className="space-y-3">
            {challenges.map((challenge, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{challenge.title}</h3>
                  <Badge variant="outline">{challenge.days}</Badge>
                </div>
                <Progress value={challenge.progress} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">{challenge.progress}% complete</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((_, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">User logged 5kg of e-waste</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
