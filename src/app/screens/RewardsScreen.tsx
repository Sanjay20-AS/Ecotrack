import { useState, useEffect, useCallback } from "react";
import { Trophy, Star, Gift, Zap, Leaf, Recycle, CheckCircle2, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { rewardsAPI } from "../services/apiService";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";

const POINTS_PER_KG = 10;
const POINTS_PER_ENTRY = 5;

const CATALOGUE = [
  { id: "r1", name: "10% Off Eco Store",    description: "Valid on any eco-friendly product",     points: 200,  icon: "🛒" },
  { id: "r2", name: "Plant a Tree",         description: "We plant a tree in your name",          points: 150,  icon: "🌳" },
  { id: "r3", name: "₹50 Voucher",          description: "Redeem on partner green brands",        points: 500,  icon: "🎟️" },
  { id: "r4", name: "20% Off Repairs",      description: "Discount at partner repair shops",       points: 300,  icon: "🔧" },
  { id: "r5", name: "Compost Starter Kit",  description: "Home composting kit delivered",         points: 750,  icon: "🪴" },
  { id: "r6", name: "5 Trees Planted",      description: "5 trees planted in your honour",        points: 600,  icon: "🌲" },
];

interface BadgeDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  metric: string;
}

interface UserBadge { id: number; badge: BadgeDef; earnedAt: string; }
interface Redemption { id: number; rewardId: string; rewardName: string; pointsCost: number; redeemedAt: string; }

export function RewardsScreen() {
  const userId = parseInt(localStorage.getItem("userId") ?? "0");

  const [points, setPoints] = useState<any>(null);
  const [allBadges, setAllBadges] = useState<BadgeDef[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const [pts, badges, ub, redemps] = await Promise.all([
        rewardsAPI.getPoints(userId),
        rewardsAPI.getBadges(),
        rewardsAPI.getUserBadges(userId),
        rewardsAPI.getRedemptions(userId),
      ]);
      setPoints(pts);
      setAllBadges(badges);
      setUserBadges(ub);
      setRedemptions(redemps);
      // Check for newly earned badges in background
      rewardsAPI.checkBadges(userId).then((updated: UserBadge[]) => {
        if (updated.length > userBadges.length) setUserBadges(updated);
      }).catch(() => {});
    } catch {
      setError("Failed to load rewards data.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge.id));
  const earnedBadges = userBadges.map((ub) => ub.badge);
  const lockedBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  const getMetricValue = (metric: string) => {
    if (!points) return 0;
    if (metric === "ENTRIES") return points.entryCount;
    if (metric === "TOTAL_KG") return points.totalKg;
    if (metric === "CO2_SAVED") return points.co2Saved;
    return 0;
  };

  const nextBadge = lockedBadges[0] ?? null;
  const nextBadgeProgress = nextBadge
    ? Math.min((getMetricValue(nextBadge.metric) / nextBadge.threshold) * 100, 100)
    : 0;

  const redeemedIds = new Set(redemptions.map((r) => r.rewardId));
  const availablePoints = points?.availablePoints ?? 0;

  const handleRedeem = async (item: typeof CATALOGUE[number]) => {
    if (availablePoints < item.points) {
      toast.error(`You need ${item.points - availablePoints} more points.`);
      return;
    }
    setRedeeming(item.id);
    try {
      await rewardsAPI.redeem({ userId, rewardId: item.id, rewardName: item.name, pointsCost: item.points });
      toast.success(`🎉 "${item.name}" redeemed! Check your email for details.`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.data?.error ?? "Redemption failed.");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading rewards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 max-w-lg mx-auto w-full">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Rewards" subtitle="Earn points by logging waste" />

      {/* Points balance */}
      <Card className="bg-card/95 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Points</p>
              <p className="text-4xl font-bold text-primary">{availablePoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total earned: {(points?.totalPoints ?? 0).toLocaleString()} pts</p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">{(points?.totalKg ?? 0).toFixed(1)} kg tracked</div>
              <div className="text-xs text-muted-foreground">{points?.entryCount ?? 0} entries</div>
              <div className="text-xs text-muted-foreground">{(points?.co2Saved ?? 0).toFixed(1)} kg CO₂ saved</div>
            </div>
          </div>

          {/* Next badge progress */}
          {nextBadge && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Next: {nextBadge.icon} {nextBadge.name}</span>
                <span className="font-medium">{Math.round(nextBadgeProgress)}%</span>
              </div>
              <Progress value={nextBadgeProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{nextBadge.description}</p>
            </div>
          )}
        </Card>

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
        {/* How points work */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold">How you earn points</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{POINTS_PER_KG} pts per kg logged</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{POINTS_PER_ENTRY} pts per entry</span>
            </div>
          </div>
        </Card>

        {/* Earned Badges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Badges Earned</h2>
            <Badge variant="secondary">{earnedBadges.length}/{allBadges.length}</Badge>
          </div>
          {earnedBadges.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              Log your first waste entry to earn your first badge!
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {earnedBadges.map((badge) => (
                <Card key={badge.id} className="p-3 text-center border-2 border-primary/20 bg-primary/5">
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-semibold leading-tight">{badge.name}</p>
                  <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto mt-1" />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Upcoming Badges</h2>
            <div className="space-y-2">
              {lockedBadges.slice(0, 4).map((badge) => {
                const val = getMetricValue(badge.metric);
                const pct = Math.min((val / badge.threshold) * 100, 100);
                return (
                  <Card key={badge.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <span className="text-2xl opacity-40">{badge.icon}</span>
                        <Lock className="h-3 w-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium">{badge.name}</p>
                          <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Rewards Catalogue */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Redeem Rewards</h2>
          </div>
          <div className="space-y-3">
            {CATALOGUE.map((item) => {
              const alreadyRedeemed = redeemedIds.has(item.id);
              const canAfford = availablePoints >= item.points;
              return (
                <Card key={item.id} className={`p-4 ${alreadyRedeemed ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium">{item.points.toLocaleString()} pts</span>
                      </div>
                    </div>
                    {alreadyRedeemed ? (
                      <Badge className="bg-green-100 text-green-700 text-xs shrink-0">Redeemed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        disabled={!canAfford || redeeming === item.id}
                        onClick={() => handleRedeem(item)}
                        className="shrink-0 text-xs"
                      >
                        {redeeming === item.id ? "..." : canAfford ? "Redeem" : `Need ${(item.points - availablePoints).toLocaleString()} more`}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Redemption History</h2>
            <Card className="divide-y">
              {redemptions.map((r) => {
                const catalogueItem = CATALOGUE.find((c) => c.id === r.rewardId);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-4">
                    <span className="text-2xl">{catalogueItem?.icon ?? "🎁"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.rewardName}</p>
                      <p className="text-xs text-muted-foreground">
                        −{r.pointsCost} pts · {new Date(r.redeemedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

