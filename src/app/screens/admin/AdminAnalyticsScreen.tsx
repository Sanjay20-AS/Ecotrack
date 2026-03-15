import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Leaf, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { wasteAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface GlobalAnalytics {
  totalWaste: number;
  totalEntries: number;
  activeUsers: number;
  averagePerUser: number;
  wasteByCategory: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#22c55e",
  PLASTIC: "#3b82f6",
  "E-WASTE": "#f59e0b",
  PAPER: "#8b5cf6",
  ORGANIC: "#10b981",
  OTHER: "#6b7280",
};

export function AdminAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await wasteAPI.getGlobalAnalytics();
      setAnalytics(data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!analytics) return null;

  const categoryBarData = Object.entries(analytics.wasteByCategory).map(([key, value]) => ({
    name: key,
    kg: Math.round(value * 100) / 100,
  }));

  const categoryPieData = categoryBarData.map((d) => ({
    name: d.name,
    value: d.kg,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Global waste tracking statistics</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Leaf}
          label="Total Waste Tracked"
          value={`${analytics.totalWaste.toLocaleString()} kg`}
          color="bg-green-500"
        />
        <SummaryCard
          icon={BarChart3}
          label="Total Submissions"
          value={analytics.totalEntries.toLocaleString()}
          color="bg-blue-500"
        />
        <SummaryCard
          icon={Users}
          label="Active Contributors"
          value={analytics.activeUsers.toLocaleString()}
          color="bg-purple-500"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Avg per User"
          value={`${analytics.averagePerUser} kg`}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Waste by Category (kg)</h3>
          {categoryBarData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryBarData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Quantity"]} />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                  {categoryBarData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie Chart */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Waste Distribution</h3>
          {categoryPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryPieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#6b7280"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Quantity"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Category breakdown table */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Total (kg)</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Share</th>
              </tr>
            </thead>
            <tbody>
              {categoryBarData
                .sort((a, b) => b.kg - a.kg)
                .map((row) => {
                  const pct = analytics.totalWaste > 0
                    ? ((row.kg / analytics.totalWaste) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={row.name} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: CATEGORY_COLORS[row.name] || "#6b7280" }}
                          />
                          {row.name}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">{row.kg}</td>
                      <td className="py-2 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`${color} rounded-lg p-2.5 shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
    </Card>
  );
}
