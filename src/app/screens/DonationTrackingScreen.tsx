import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import {
  Package, MapPin, Clock, CheckCircle2, Truck, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, Leaf, Eye
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { wasteAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

interface WasteEntry {
  id: number;
  type: string;
  quantity: number;
  description: string;
  status: string;
  locationAddress?: string;
  createdAt: string;
  updatedAt?: string;
  collectedBy?: { id: number; name: string; email?: string };
  collectorNotes?: string;
}

const POLL_INTERVAL = 15000; // 15 seconds

export function DonationTrackingScreen() {
  const [donations, setDonations] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const userId = parseInt(localStorage.getItem("userId") || "0");

  const loadDonations = useCallback(async (showSpinner = false) => {
    if (showSpinner) setManualRefreshing(true);
    try {
      const waste = await wasteAPI.getWasteByUserId(userId);
      const sorted = waste.sort(
        (a: WasteEntry, b: WasteEntry) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDonations(sorted);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load donations:", err);
      if (showSpinner) toast.error("Failed to refresh donations.");
    } finally {
      setLoading(false);
      setManualRefreshing(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // Auto-polling every 15s
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => loadDonations(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isPolling, loadDonations]);

  const statusSteps = ["PENDING", "IN_PROGRESS", "COLLECTED"];

  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pending Pickup",
          description: "Waiting for a collector to claim",
          color: "text-amber-700",
          bgColor: "bg-amber-100",
          borderColor: "border-amber-300",
          icon: Clock,
        };
      case "IN_PROGRESS":
        return {
          label: "Collector Assigned",
          description: "A collector has claimed your waste",
          color: "text-blue-700",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-300",
          icon: Truck,
        };
      case "COLLECTED":
        return {
          label: "Collected!",
          description: "Your waste has been picked up",
          color: "text-emerald-700",
          bgColor: "bg-emerald-100",
          borderColor: "border-emerald-300",
          icon: CheckCircle2,
        };
      default:
        return {
          label: status,
          description: "",
          color: "text-gray-700",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-300",
          icon: Package,
        };
    }
  };

  const getTimeSince = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(ms / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(ms / 86400000);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const activeDonations = donations.filter((d) => d.status !== "COLLECTED");
  const completedDonations = donations.filter((d) => d.status === "COLLECTED");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Eye className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <TopBar variant="banner" title="My Donations" subtitle={`${activeDonations.length} active · ${completedDonations.length} completed`} />

      <div className="px-6 py-5 space-y-5">
        {donations.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-lg">No donations yet</p>
            <p className="text-sm mt-1 mb-4">Start by logging your first waste entry.</p>
            <Link to="/app/track">
              <Button>Log Waste</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Active Donations */}
            {activeDonations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" /> Active
                  <Badge variant="secondary" className="ml-auto">{activeDonations.length}</Badge>
                </h2>
                <div className="space-y-3">
                  {activeDonations.map((entry) => {
                    const statusInfo = getStatusInfo(entry.status);
                    const stepIdx = getStepIndex(entry.status);
                    const progressPercent = ((stepIdx + 1) / statusSteps.length) * 100;
                    const isExpanded = expandedId === entry.id;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Card
                        key={entry.id}
                        className={`overflow-hidden border-l-4 ${statusInfo.borderColor}`}
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {entry.type}
                                </Badge>
                                <span className="text-sm font-bold">{entry.quantity} kg</span>
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color} font-medium`}
                                >
                                  <StatusIcon className="h-3 w-3" /> {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">{entry.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted {getTimeSince(entry.createdAt)}
                              </p>
                            </div>
                            <div className="flex-shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="mt-3">
                            <Progress value={progressPercent} className="h-1.5" />
                            <div className="flex justify-between mt-1">
                              {statusSteps.map((step, i) => (
                                <span
                                  key={step}
                                  className={`text-[10px] ${
                                    i <= stepIdx ? "text-primary font-semibold" : "text-muted-foreground"
                                  }`}
                                >
                                  {step === "IN_PROGRESS" ? "Assigned" : step === "PENDING" ? "Pending" : "Collected"}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Timeline */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t pt-3 space-y-3">
                            {/* Status Timeline */}
                            <div className="space-y-0">
                              {statusSteps.map((step, i) => {
                                const done = i <= stepIdx;
                                const isCurrent = i === stepIdx;
                                return (
                                  <div key={step} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                          done
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                                      >
                                        {done ? (
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : (
                                          <span className="text-[10px] font-bold">{i + 1}</span>
                                        )}
                                      </div>
                                      {i < statusSteps.length - 1 && (
                                        <div
                                          className={`w-0.5 h-6 ${
                                            i < stepIdx ? "bg-primary" : "bg-muted"
                                          }`}
                                        />
                                      )}
                                    </div>
                                    <div className="pb-3">
                                      <p
                                        className={`text-sm font-medium ${
                                          done ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                      >
                                        {step === "PENDING"
                                          ? "Waste Submitted"
                                          : step === "IN_PROGRESS"
                                          ? "Collector Assigned"
                                          : "Pickup Complete"}
                                      </p>
                                      {step === "PENDING" && done && (
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(entry.createdAt).toLocaleString()}
                                        </p>
                                      )}
                                      {step === "IN_PROGRESS" && done && entry.collectedBy && (
                                        <p className="text-xs text-muted-foreground">
                                          Collector: {entry.collectedBy.name}
                                        </p>
                                      )}
                                      {step === "COLLECTED" && done && entry.updatedAt && (
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(entry.updatedAt).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Collector Info */}
                            {entry.collectedBy && (
                              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                                  <Truck className="h-4 w-4 text-blue-700" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-800">
                                    {entry.collectedBy.name}
                                  </p>
                                  <p className="text-xs text-blue-600">Assigned Collector</p>
                                </div>
                              </div>
                            )}

                            {/* Collector Notes */}
                            {entry.collectorNotes && (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Collector Notes
                                </p>
                                <p className="text-sm">{entry.collectorNotes}</p>
                              </div>
                            )}

                            {/* Location */}
                            {entry.locationAddress && (
                              <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{entry.locationAddress}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Donations */}
            {completedDonations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Completed
                  <Badge variant="secondary" className="ml-auto">{completedDonations.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {completedDonations.slice(0, 5).map((entry) => (
                    <Card key={entry.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                {entry.type}
                              </span>
                              <span className="text-sm font-bold">{entry.quantity} kg</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {getTimeSince(entry.updatedAt || entry.createdAt)}
                        </span>
                      </div>
                    </Card>
                  ))}
                  {completedDonations.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      + {completedDonations.length - 5} more completed
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Impact Summary */}
            {completedDonations.length > 0 && (
              <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-5">
                <div className="flex items-center gap-4">
                  <Leaf className="h-10 w-10 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-0.5">Your Impact</h3>
                    <p className="text-xl font-bold">
                      {completedDonations
                        .reduce((sum, d) => sum + d.quantity, 0)
                        .toFixed(1)}{" "}
                      kg
                    </p>
                    <p className="text-xs opacity-90">
                      waste successfully collected & recycled
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
