import { useState, useEffect } from "react";
import {
  History, MapPin, CheckCircle2, Package, FileText, Calendar,
  ChevronDown, ChevronUp, User as UserIcon
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { wasteAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

interface WasteEntry {
  id: number;
  type: string;
  quantity: number;
  description: string;
  status: string;
  locationAddress?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  createdAt: string;
  updatedAt?: string;
  collectorNotes?: string;
  user?: { id: number; name: string; email?: string };
}

export function CollectorHistoryScreen() {
  const [history, setHistory] = useState<WasteEntry[]>([]);
  const [filtered, setFiltered] = useState<WasteEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const userId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applySearch();
  }, [history, searchQuery]);

  const loadHistory = async () => {
    try {
      const data = await wasteAPI.getCollectorHistory(userId);
      // Sort newest first
      const sorted = (data || []).sort(
        (a: WasteEntry, b: WasteEntry) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
      setHistory(sorted);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (!searchQuery.trim()) {
      setFiltered(history);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      history.filter(
        (w) =>
          w.description.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q) ||
          (w.locationAddress || "").toLowerCase().includes(q) ||
          (w.user?.name || "").toLowerCase().includes(q)
      )
    );
  };

  const totalKg = history.reduce((sum, w) => sum + w.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <History className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Pickup History" subtitle={`${history.length} completed · ${totalKg.toFixed(1)} kg`} />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{history.length}</p>
            <p className="text-xs text-muted-foreground">Pickups</p>
          </Card>
          <Card className="p-4 text-center">
            <Package className="h-5 w-5 text-secondary mx-auto mb-1" />
            <p className="text-xl font-bold">{totalKg.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg Total</p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold">
              {history.length > 0
                ? new Date(
                    history[0].updatedAt || history[0].createdAt
                  ).toLocaleDateString([], { month: "short", day: "numeric" })
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Last Pickup</p>
          </Card>
        </div>

        {/* Search */}
        <Input
          placeholder="Search by description, type, donor..."
          className="h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* History List */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No completed pickups</p>
            <p className="text-sm mt-1">
              {searchQuery ? "Try a different search." : "Start collecting to build your history."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const collectedDate = new Date(entry.updatedAt || entry.createdAt);

              return (
                <Card
                  key={entry.id}
                  className="overflow-hidden transition-all"
                >
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : entry.id)
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs font-medium">
                            {entry.type}
                          </Badge>
                          <span className="text-sm font-bold">
                            {entry.quantity} kg
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> COLLECTED
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {entry.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {collectedDate.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            at{" "}
                            {collectedDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {entry.user?.name && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <UserIcon className="h-3 w-3" /> {entry.user.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-3 space-y-3">
                      {/* Donor Info */}
                      {entry.user?.name && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {entry.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {entry.user.name}
                            </p>
                            {entry.user.email && (
                              <p className="text-xs text-muted-foreground">
                                {entry.user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {entry.locationAddress && (
                        <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{entry.locationAddress}</p>
                        </div>
                      )}

                      {/* Collector Notes */}
                      {entry.collectorNotes && (
                        <div className="flex items-start gap-2 bg-accent/10 p-3 rounded-lg">
                          <FileText className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">
                              Collector Notes
                            </p>
                            <p className="text-sm">{entry.collectorNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <Card className="p-4 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {history.length} completed pickups
          </p>
        </Card>
      </div>
    </div>
  );
}
