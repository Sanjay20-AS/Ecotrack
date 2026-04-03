import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import TopBar from "../components/TopBar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { carbonAPI } from "../services/apiService";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function CarbonFootprintScreen() {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId") || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // First trigger a server-side recalculation to ensure monthly summary is populated
        if (userId) {
          await carbonAPI.recalculate(userId).catch(() => null);
        }

        // Then fetch fresh history and update the chart
        const h = await carbonAPI.getCarbonHistory(userId).catch(() => []);
        if (!mounted) return;
        setHistory(Array.isArray(h) ? h : []);

        // Also fetch current summary and leaderboard in background
        const [s, l] = await Promise.all([
          carbonAPI.getCurrentCarbon(userId).catch(() => null),
          carbonAPI.getLeaderboard().catch(() => []),
        ]);
        if (!mounted) return;
        setSummary(s || null);
        setLeaderboard(Array.isArray(l) ? l : []);
      } catch (err: any) {
        console.error("Carbon load failed:", err);
        setError(err?.message || "Failed to load carbon data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <p className="text-muted-foreground">Please sign in to view your carbon footprint.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <TopBar variant="banner" title="Carbon Footprint" />

      <div className="pt-6 pb-10">
        <div className="mx-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
                <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
                <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
              </div>
              <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-center mx-4">
              <div className="text-red-600 font-semibold">{error}</div>
              <div className="mt-4">
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          ) : (
            <>
              {/* HERO TOP CARD */}
              <div className="w-full rounded-b-3xl py-8 px-6 mb-4" style={{ background: 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)', color: '#fff' }}>
                <div className="max-w-4xl mx-auto text-center">
                  <div className="text-5xl font-bold">{summary?.totalCarbonSaved ?? 0} kg</div>
                  <div className="mt-2 text-sm">kg CO₂ Saved This Month</div>

                  <div className="mt-6 text-sm">Score: {summary?.carbonScore ?? 0}/1000</div>
                  <div className="mt-2 w-full bg-white/30 rounded-full h-4">
                    <div className="h-4 rounded-full bg-white" style={{ width: `${Math.min(((summary?.carbonScore ?? 0) / 1000) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-3 gap-4 mb-4 mx-0">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-xl font-bold text-red-600">{summary?.totalCarbonGenerated ?? 0} kg</div>
                  <div className="text-sm text-gray-500 mt-1">CO₂ Generated</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-xl font-bold text-green-700">{summary?.netCarbon ?? 0} kg</div>
                  <div className="text-sm text-gray-500 mt-1">Net Impact</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <div className="text-xl font-bold text-green-700">{summary?.carbonScore ?? 0}</div>
                  <div className="text-sm text-gray-500 mt-1">Carbon Score</div>
                </div>
              </div>

              {/* EQUIVALENTS SECTION */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <h3 className="font-semibold mb-3">Your Impact Equals</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-lg">🌳</div>
                    <div className="mt-3 text-2xl font-bold">{summary?.treesEquivalent ?? 0}</div>
                    <div className="text-sm text-gray-500 mt-1">trees planted</div>
                  </div>

                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg">🚗</div>
                    <div className="mt-3 text-2xl font-bold">{summary?.carKmEquivalent ?? 0}</div>
                    <div className="text-sm text-gray-500 mt-1">km not driven</div>
                  </div>

                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-lg">💡</div>
                    <div className="mt-3 text-2xl font-bold">{summary?.electricityHoursEquivalent ?? 0}</div>
                    <div className="text-sm text-gray-500 mt-1">hours electricity</div>
                  </div>
                </div>
              </div>

              {/* CHART SECTION */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Monthly CO₂ Saved</h3>
                </div>
                {Array.isArray(history) && history.length > 0 ? (
                  (() => {
                    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const mapped = history
                      .map((h: any) => ({
                        month: (monthNames[h.month] || String(h.month)) + (h.year ? ` ${h.year}` : ""),
                        carbonSaved: Number(h.totalCarbonSaved ?? h.carbonSaved ?? 0),
                        rawMonth: h.month,
                        year: h.year,
                      }))
                      .filter((d: any) => !isNaN(d.carbonSaved) && d.carbonSaved > 0)
                      .sort((a: any, b: any) => (a.year - b.year) || (a.rawMonth - b.rawMonth));

                    if (mapped.length === 0) {
                      return (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                          <div>Complete pickups to see your monthly progress 🌱</div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={mapped}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                            <YAxis label={{ value: 'kg CO₂', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: any) => [`${value} kg CO2 saved`, '']} />
                            <Bar dataKey="carbonSaved" fill="#16a34a" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                    <div>Complete pickups to see your monthly progress 🌱</div>
                  </div>
                )}
              </div>

              {/* COMMUNITY COMPARISON */}
              <div className="bg-[#f0fdf4] border border-green-200 rounded-2xl shadow-sm p-4 mb-4">
                {summary ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">{summary?.pctMoreThanAvg ?? 0}%</div>
                      <div className="mt-2 text-sm">You save <strong>{summary?.pctMoreThanAvg ?? 0}%</strong> more than average EcoTrack user</div>
                    </div>
                    <div className="text-sm text-gray-600">Your Rank: <strong>{summary?.rank ?? '—'}</strong></div>
                  </div>
                ) : (
                  <div className="text-gray-600">Log waste to see your community ranking</div>
                )}
              </div>

              {/* LEADERBOARD */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                <h3 className="font-semibold mb-3">🏆 Top Carbon Savers</h3>
                <div className="divide-y">
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.slice(0, 10).map((u: any, idx: number) => {
                      const isCurrent = (u.userId ?? u.id) === userId;
                      const rank = idx + 1;
                      const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                      return (
                        <div key={idx} className={`flex items-center justify-between py-3 ${isCurrent ? 'bg-green-50 rounded-lg' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-lg">{rankLabel}</div>
                            <div className="truncate text-sm font-medium">{u.name}</div>
                          </div>
                          <div className="text-sm text-right">
                            <div className="font-semibold text-green-700">{u.totalCarbonSaved} kg</div>
                            <div className="text-xs text-gray-500">{u.treesEquivalent ?? 0} trees</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-gray-500">No leaderboard data yet</div>
                  )}
                </div>
              </div>

              {/* EMPTY / ZERO STATE CTA */}
              {((summary?.totalCarbonSaved ?? 0) === 0 && (summary?.totalCarbonGenerated ?? 0) === 0) && (
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
                  <div className="text-lg font-semibold">Start logging waste to track your carbon impact! 🌱</div>
                  <div className="mt-4">
                    <Button onClick={() => navigate('/app/track')} className="bg-green-600 text-white">Log Waste Now</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
