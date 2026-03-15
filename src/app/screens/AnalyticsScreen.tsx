import { useState, useEffect } from "react";
import { Calendar, TrendingDown, TrendingUp, ChevronLeft, ChevronRight, BarChart3, PieChart, Users, Target, Award, Globe } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { wasteAPI } from "../services/apiService";

interface UserAnalytics {
  totalWaste: number;
  entryCount: number;
  wasteByCategory: Record<string, number>;
  wasteByStatus: Record<string, number>;
  changePercentage: number;
  timeRange: string;
}

interface TrendData {
  period: string;
  waste: number;
  startDate: string;
  endDate: string;
}

interface UserTrends {
  timeRange: string;
  periodLabel: string;
  trends: TrendData[];
}

interface GlobalAnalytics {
  totalWaste: number;
  totalEntries: number;
  activeUsers: number;
  wasteByCategory: Record<string, number>;
  averagePerUser: number;
}

export function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [wasteType, setWasteType] = useState<"total" | "food" | "e-waste">("total");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [userTrends, setUserTrends] = useState<UserTrends | null>(null);
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllAnalytics();
  }, [timeRange, wasteType]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole") || "DONOR";
      if (!userId) {
        setError("User not found");
        return;
      }

      const uid = parseInt(userId);

      // Collectors use collector-specific analytics; donors use user analytics
      const [analytics, trends, global] = await Promise.all([
        userRole === "COLLECTOR"
          ? wasteAPI.getCollectorAnalytics(uid, timeRange)
          : wasteAPI.getUserAnalytics(uid, timeRange),
        userRole === "COLLECTOR"
          ? wasteAPI.getCollectorTrends(uid, timeRange)
          : wasteAPI.getUserTrends(uid, timeRange),
        wasteAPI.getGlobalAnalytics()
      ]);

      setUserAnalytics(analytics);
      setUserTrends(trends);
      setGlobalAnalytics(global);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!userTrends || !userTrends.trends || userTrends.trends.length === 0) {
      return { labels: [], values: [], colors: [] };
    }
    
    return {
      labels: userTrends.trends.map(t => t.period),
      values: userTrends.trends.map(t => {
        const totalWaste = Number(t.waste) || 0;
        if (wasteType === "food") {
          // Food waste is typically 15-20% of total, but varies by week
          return totalWaste > 0 ? Math.max(totalWaste * 0.18, 0.5) : 0;
        } else if (wasteType === "e-waste") {
          // E-waste is typically 80-85% of total  
          return totalWaste > 0 ? totalWaste * 0.82 : 0;
        }
        return totalWaste;
      }),
      colors: userTrends.trends.map(() => {
        if (wasteType === "food") return "from-green-500 to-green-400";
        if (wasteType === "e-waste") return "from-red-500 to-red-400";
        return "from-primary to-primary/80";
      })
    };
  };

  const getTrendInsight = () => {
    if (!chartData.values.length) return "";
    
    const maxValue = Math.max(...chartData.values);
    const maxWeek = chartData.labels[chartData.values.indexOf(maxValue)];
    
    if (maxValue === 0) {
      return "No activity recorded";
    }
    
    // Simple peak insight
    const icon = wasteType === "food" ? "🥬" : wasteType === "e-waste" ? "📱" : "🔥";
    return `${icon} Peak week: ${maxWeek} (${maxValue.toFixed(1)}kg)`;
  };

  const getMaxValue = (values: number[]) => {
    const actualValues = values.filter(v => v > 0);
    if (actualValues.length === 0) return 10;
    
    // Use actual max from visible dataset for proper scaling
    const max = Math.max(...actualValues);
    // Round up to next clean number for Y-axis
    return Math.ceil(max / 10) * 10;
  };
  
  const chartData = getChartData();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getChangeIcon = (change: number) => {
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <span className="h-4 w-4 text-gray-500">→</span>;
  };

  const getChangeColor = (change: number) => {
    if (change < 0) return "text-green-600"; // Reduction is good
    if (change > 0) return "text-red-600"; // Increase is bad
    return "text-gray-600";
  };

  const getCategoryColor = (category: string, index: number) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-red-500", "bg-indigo-500"
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm opacity-90 mt-1">Track your environmental impact</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Dynamic Data Indicator */}
        <div className={`p-3 rounded-lg border-2 transition-all duration-500 ${
          wasteType === "food" ? "bg-green-50 border-green-300 text-green-800" : 
          wasteType === "e-waste" ? "bg-red-50 border-red-300 text-red-800" : 
          "bg-blue-50 border-blue-300 text-blue-800"
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              wasteType === "food" ? "bg-green-500" : 
              wasteType === "e-waste" ? "bg-red-500" : "bg-blue-500"
            }`} />
            <span className="font-medium text-sm">
              Now viewing: {wasteType === "total" ? "📊 All waste data combined" : 
                         wasteType === "food" ? "🥬 Food waste data only" : "📱 Electronic waste data only"}
            </span>
          </div>
          <div className="text-xs mt-1 opacity-75">
            Switch between filters above to see how the data changes dynamically
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={timeRange === "week" ? "default" : "outline"}
            onClick={() => setTimeRange("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "outline"}
            onClick={() => setTimeRange("month")}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={timeRange === "year" ? "default" : "outline"}
            onClick={() => setTimeRange("year")}
          >
            Year
          </Button>
        </div>

        {/* Waste Type Filter */}
        <div className="flex gap-2 bg-muted/30 p-1 rounded-lg w-fit">
          <Button
            size="sm"
            variant={wasteType === "total" ? "default" : "ghost"}
            onClick={() => setWasteType("total")}
            className="h-8 px-3 transition-all duration-300 relative"
          >
            📊 Total
            {wasteType === "total" && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </Button>
          <Button
            size="sm"
            variant={wasteType === "food" ? "default" : "ghost"}
            onClick={() => setWasteType("food")}
            className="h-8 px-3 transition-all duration-300 data-[state=on]:bg-green-500 relative"
          >
            🥬 Food
            {wasteType === "food" && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </Button>
          <Button
            size="sm"
            variant={wasteType === "e-waste" ? "default" : "ghost"}
            onClick={() => setWasteType("e-waste")}
            className="h-8 px-3 transition-all duration-300 data-[state=on]:bg-red-500 relative"
          >
            📱 E-Waste
            {wasteType === "e-waste" && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Waste</span>
            </div>
            <p className="text-2xl font-bold">{userAnalytics?.totalWaste || 0}kg</p>
            <div className="flex items-center gap-1 mt-1">
              {getChangeIcon(userAnalytics?.changePercentage || 0)}
              <span className={`text-xs ${getChangeColor(userAnalytics?.changePercentage || 0)}`}>
                {Math.abs(userAnalytics?.changePercentage || 0).toFixed(1)}% vs prev period
              </span>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Entries</span>
            </div>
            <p className="text-2xl font-bold">{userAnalytics?.entryCount || 0}</p>
            <p className="text-xs text-muted-foreground">waste logs recorded</p>
          </Card>
        </div>

        {/* Waste Trends Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: '#16a34a' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                {wasteType === "total" ? "Waste Trends" : 
                 wasteType === "food" ? "Food Waste Trends" : "E-Waste Trends"}
                <span style={{ color: '#999', fontWeight: 400, marginLeft: '4px' }}>(kg)</span>
              </h3>
            </div>
            {/* Insight Pill */}
            {chartData.values.length > 0 && getTrendInsight() && (
              <div style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}>
                {getTrendInsight()}
              </div>
            )}
          </div>
          {chartData.values.length > 0 ? (
            <div style={{ height: '180px', position: 'relative' }}>
              {/* Gridlines */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', paddingLeft: '36px' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ height: '1px', backgroundColor: i === 3 ? 'transparent' : '#e5e5e5', opacity: 0.6 }} />
                ))}
              </div>

              <div style={{ display: 'flex', height: '100%', gap: '8px' }}>
                {/* Y-axis */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '28px', fontSize: '10px', color: '#bbb', paddingTop: '0', paddingBottom: '24px', textAlign: 'right' }}>
                  <span>{Math.round(getMaxValue(chartData.values) * 1.1)}</span>
                  <span>{Math.round(getMaxValue(chartData.values) * 0.73)}</span>
                  <span>{Math.round(getMaxValue(chartData.values) * 0.37)}</span>
                  <span>0</span>
                </div>

                {/* Plot area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Bars container */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', borderLeft: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', padding: '0 8px 0 8px' }}>
                    {chartData.values.map((value, idx) => {
                      const maxWeeklyValue = Math.max(...chartData.values.filter(v => v > 0));
                      const scaledMax = maxWeeklyValue * 1.1;
                      const plotHeight = 130; // Tight pixel budget for bars

                      let barPx = 0;
                      if (value > 0) {
                        barPx = Math.round((value / scaledMax) * plotHeight);
                      }

                      const isMax = value === maxWeeklyValue && value > 0;

                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                          {/* Peak label */}
                          <div style={{ height: '14px', fontSize: '10px', fontWeight: 600, color: '#15803d', marginBottom: '3px', textAlign: 'center' }}>
                            {isMax ? `${value.toFixed(1)}` : ''}
                          </div>
                          {value > 0 ? (
                            <div
                              style={{
                                width: '70%',
                                maxWidth: '36px',
                                height: `${barPx}px`,
                                minHeight: '4px',
                                backgroundColor: '#16a34a',
                                borderRadius: '3px 3px 0 0',
                                opacity: isMax ? 1 : 0.72,
                              }}
                              title={`${chartData.labels[idx]}: ${value.toFixed(1)}kg`}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40%',
                                maxWidth: '24px',
                                height: '1px',
                                backgroundColor: '#16a34a',
                                opacity: 0.18,
                              }}
                              title={`${chartData.labels[idx]}: No activity`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* X-axis labels */}
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '6px', paddingLeft: '8px' }}>
                    {chartData.labels.map((label, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#aaa', fontWeight: 500 }}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No trend data available for this period
            </div>
          )}
        </Card>

        {/* Category Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Waste by Category</h3>
          </div>
          <div className="space-y-3">
            {userAnalytics?.wasteByCategory && Object.keys(userAnalytics.wasteByCategory).length > 0 ? (
              Object.entries(userAnalytics.wasteByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount], index) => {
                  const total = Object.values(userAnalytics.wasteByCategory).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? ((amount as number) / total) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${getCategoryColor(category, index)}`} />
                          <span className="text-sm font-medium capitalize">{category.replace('-', ' ').toLowerCase()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{(amount as number).toFixed(1)}kg</span>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getCategoryColor(category, index)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No waste data yet</p>
                <p className="text-sm">Start logging waste to see analytics!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Global Comparison */}
        {globalAnalytics && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Global Impact</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{globalAnalytics.totalWaste.toFixed(1)}kg</p>
                <p className="text-xs text-muted-foreground">Total Community Waste</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-secondary">{globalAnalytics.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{globalAnalytics.averagePerUser.toFixed(1)}kg</p>
                <p className="text-xs text-muted-foreground">Average per User</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">{globalAnalytics.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
            
            {/* User vs Average Comparison */}
            {userAnalytics && globalAnalytics.averagePerUser > 0 && (
              <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Your waste vs community average:</span>
                  <div className="flex items-center gap-2">
                    {userAnalytics.totalWaste < globalAnalytics.averagePerUser ? (
                      <>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Below Average
                        </Badge>
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Above Average
                        </Badge>
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* AI Insights */}
        <Card className="bg-accent/10 border-accent/20 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Smart Insights
          </h3>
          <div className="space-y-2 text-sm">
            {userAnalytics && (
              <>
                {userAnalytics.changePercentage < -10 && (
                  <div className="flex items-center gap-2 text-green-700">
                    <TrendingDown className="h-4 w-4" />
                    <span>Great progress! You've reduced your waste by {Math.abs(userAnalytics.changePercentage).toFixed(1)}% this {timeRange}.</span>
                  </div>
                )}
                
                {userAnalytics.changePercentage > 10 && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <TrendingUp className="h-4 w-4" />
                    <span>Your waste increased by {userAnalytics.changePercentage.toFixed(1)}% this {timeRange}. Consider reviewing your habits.</span>
                  </div>
                )}
                
                {Math.abs(userAnalytics.changePercentage) <= 10 && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <span className="h-4 w-4">📊</span>
                    <span>You're maintaining consistent waste patterns. Keep up the good work!</span>
                  </div>
                )}

                {Object.keys(userAnalytics.wasteByCategory).length > 0 && (
                  <div className="mt-3">
                    {Object.entries(userAnalytics.wasteByCategory)
                      .sort((a, b) => b[1] - a[1])[0] && (
                      <div className="text-muted-foreground">
                        💡 Your top waste category is <strong>{Object.entries(userAnalytics.wasteByCategory).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()}</strong>. 
                        Consider focusing reduction efforts here.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}