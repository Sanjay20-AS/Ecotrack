import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Package, MapPin, Clock, CheckCircle2, Truck, Filter,
  ArrowUpDown, AlertTriangle, Phone, ChevronDown, ChevronUp, X,
  Zap, Building2, CalendarClock, Gauge, Camera
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../components/ui/dialog";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";
import { wasteAPI, wastePriorityAPI, pickupAPI, facilityAPI, userAPI, uploadAPI, ApiError } from "../services/apiService";

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
  user?: { id: number; name: string; email?: string };
}

interface PriorityInfo {
  priorityScore: number;
  priorityLevel: string;
}

interface ScheduleInfo {
  pickupSchedule: string;
}

interface FacilityInfo {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

type FilterStatus = "ALL" | "PENDING" | "IN_PROGRESS" | "COLLECTED";
type SortKey = "date" | "quantity" | "urgency" | "priority";

export function CollectorPickupsScreen() {
  const [searchParams] = useSearchParams();
  const [allWaste, setAllWaste] = useState<WasteEntry[]>([]);
  const [filteredWaste, setFilteredWaste] = useState<WasteEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [collectorNotes, setCollectorNotes] = useState<Record<number, string>>({});
  const [inlineError, setInlineError] = useState<Record<number, string>>({});
  const [priorityData, setPriorityData] = useState<Record<number, PriorityInfo>>({});
  const [scheduleData, setScheduleData] = useState<Record<number, ScheduleInfo>>({});
  const [facilityData, setFacilityData] = useState<Record<number, FacilityInfo | null>>({});
  const [completionTarget, setCompletionTarget] = useState<number | null>(null);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const userId = parseInt(localStorage.getItem("userId") || "0");
  const [accountStatus, setAccountStatus] = useState(localStorage.getItem("accountStatus") || "ACTIVE");
  const isActive = accountStatus === "ACTIVE";
  const userLat = parseFloat(localStorage.getItem("userLat") || "11.0168");
  const userLng = parseFloat(localStorage.getItem("userLng") || "76.9558");
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllWaste();
    // Fetch fresh account status from server
    userAPI.getUserById(userId).then((u: any) => {
      const status = u.accountStatus || "ACTIVE";
      setAccountStatus(status);
      localStorage.setItem("accountStatus", status);
    }).catch(() => {});
  }, []);

  // Handle URL params for pre-filtering
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter === "urgent") {
      setFilterStatus("PENDING");
      setSortBy("urgency");
    }
    const urlId = searchParams.get("id");
    if (urlId) {
      const target = allWaste.find((w) => w.id === parseInt(urlId));
      if (target) setSelectedEntry(target);
    }
  }, [searchParams, allWaste]);

  useEffect(() => {
    applyFilters();
  }, [allWaste, filterStatus, sortBy, searchQuery]);

  const loadAllWaste = async () => {
    try {
      const [pending, inProgress, collected] = await Promise.all([
        wasteAPI.getWasteByStatus("PENDING").catch(() => []),
        wasteAPI.getWasteByStatus("IN_PROGRESS").catch(() => []),
        wasteAPI.getWasteByStatus("COLLECTED").catch(() => []),
      ]);
      const all = [...pending, ...inProgress, ...collected];
      setAllWaste(all);
      // Compute priority scores, schedules, and nearest facilities for pending/in-progress items
      loadAlgorithmData(all.filter((w) => w.status !== "COLLECTED"));
    } catch (err) {
      console.error("Failed to load waste:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlgorithmData = async (entries: WasteEntry[]) => {
    const priorities: Record<number, PriorityInfo> = {};
    const schedules: Record<number, ScheduleInfo> = {};
    const facilities: Record<number, FacilityInfo | null> = {};

    await Promise.all(
      entries.map(async (entry) => {
        const daysOld = getDaysOld(entry.createdAt);
        const lat = entry.locationLatitude || userLat;
        const lng = entry.locationLongitude || userLng;
        const distKm = haversineDistance(userLat, userLng, lat, lng);

        try {
          const [prio, sched, fac] = await Promise.all([
            wastePriorityAPI.calculatePriority(entry.type, entry.quantity, daysOld, distKm).catch(() => null),
            pickupAPI.schedulePickup(entry.type, entry.quantity, daysOld, 5).catch(() => null),
            facilityAPI.getNearestFacility(entry.type, lat, lng).catch(() => null),
          ]);
          if (prio) priorities[entry.id] = prio;
          if (sched) schedules[entry.id] = sched;
          facilities[entry.id] = fac;
        } catch {
          // ignore individual failures
        }
      })
    );

    setPriorityData(priorities);
    setScheduleData(schedules);
    setFacilityData(facilities);
  };

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const applyFilters = () => {
    let list = [...allWaste];

    // Status filter
    if (filterStatus !== "ALL") {
      list = list.filter((w) => w.status === filterStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.description.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q) ||
          (w.locationAddress || "").toLowerCase().includes(q) ||
          (w.user?.name || "").toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "quantity") return b.quantity - a.quantity;
      if (sortBy === "priority") {
        const pa = priorityData[a.id]?.priorityScore || 0;
        const pb = priorityData[b.id]?.priorityScore || 0;
        return pb - pa; // highest priority first
      }
      if (sortBy === "urgency") {
        const ageA = Date.now() - new Date(a.createdAt).getTime();
        const ageB = Date.now() - new Date(b.createdAt).getTime();
        return ageB - ageA; // oldest first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredWaste(list);
  };

  const handleStatusUpdate = async (
    wasteId: number,
    newStatus: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!isActive) {
      const msg = accountStatus === "PENDING_APPROVAL"
        ? "Your account is pending approval. You cannot claim pickups yet."
        : "Your account has been rejected. Contact support.";
      toast.error(msg);
      setInlineError((prev) => ({ ...prev, [wasteId]: msg }));
      return;
    }

    // For COLLECTED: open completion dialog to capture photo + GPS
    if (newStatus === "COLLECTED") {
      setCompletionTarget(wasteId);
      setCompletionPhoto(null);
      setCompletionPhotoPreview(null);
      return;
    }

    setActionLoading(wasteId);
    setErrorMsg("");
    setInlineError((prev) => { const c = { ...prev }; delete c[wasteId]; return c; });
    try {
      const notes = collectorNotes[wasteId]?.trim() || undefined;
      await wasteAPI.updateWasteStatus(wasteId, newStatus, userId, notes);
      const successText = "Pickup claimed! Marked as In Progress.";
      toast.success(successText);
      setSuccessMsg(successText);
      setTimeout(() => setSuccessMsg(""), 3000);
      setCollectorNotes((prev) => { const copy = { ...prev }; delete copy[wasteId]; return copy; });
      await loadAllWaste();
      if (selectedEntry?.id === wasteId) {
        setSelectedEntry(null);
      }
    } catch (err: any) {
      const status = err instanceof ApiError ? err.status : 0;
      const data = err instanceof ApiError ? err.data : null;
      let msg: string;
      if (status === 409) {
        msg = data?.error || "This pickup has already been claimed by another collector.";
      } else if (status === 403) {
        msg = data?.error || "Only the assigned collector can complete this pickup.";
        if (data?.accountStatus) {
          localStorage.setItem("accountStatus", data.accountStatus);
        }
      } else {
        msg = data?.error || err?.message || "Failed to update status. Please try again.";
      }
      setInlineError((prev) => ({ ...prev, [wasteId]: msg }));
      setErrorMsg(msg);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        setErrorMsg("");
        setInlineError((prev) => { const c = { ...prev }; delete c[wasteId]; return c; });
      }, 6000);
      console.error("Status update failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionPhoto(file);
      setCompletionPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompletePickup = async () => {
    if (!completionTarget) return;
    if (!completionPhoto) {
      toast.error("Please upload a photo of the collected waste.");
      return;
    }

    setUploadingPhoto(true);
    setActionLoading(completionTarget);
    setInlineError((prev) => { const c = { ...prev }; delete c[completionTarget]; return c; });

    try {
      // 1. Upload photo
      const uploadResult = await uploadAPI.uploadWasteImage(completionPhoto);

      // 2. Get collector GPS
      const gps = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported by your browser."));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(new Error("Failed to get your location. Please enable GPS and try again.")),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });

      // 3. Call API with photo + GPS
      const notes = collectorNotes[completionTarget]?.trim() || undefined;
      await wasteAPI.updateWasteStatus(completionTarget, "COLLECTED", userId, notes, {
        collectionPhotoUrl: uploadResult.url,
        collectorLatitude: gps.lat,
        collectorLongitude: gps.lng,
      });

      toast.success("Pickup completed! Marked as Collected.");
      setSuccessMsg("Pickup completed! Marked as Collected.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setCollectorNotes((prev) => { const copy = { ...prev }; delete copy[completionTarget]; return copy; });
      setCompletionTarget(null);
      setCompletionPhoto(null);
      setCompletionPhotoPreview(null);
      await loadAllWaste();
      if (selectedEntry?.id === completionTarget) setSelectedEntry(null);
    } catch (err: any) {
      const data = err instanceof ApiError ? err.data : null;
      const msg = data?.error || err?.message || "Failed to complete pickup.";
      toast.error(msg);
      setInlineError((prev) => ({ ...prev, [completionTarget]: msg }));
      console.error("Completion failed:", err);
    } finally {
      setUploadingPhoto(false);
      setActionLoading(null);
    }
  };

  const getDaysOld = (dateStr: string) => {
    return Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86400000
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-300";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-300";
      case "COLLECTED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-3.5 w-3.5" />;
      case "IN_PROGRESS": return <Truck className="h-3.5 w-3.5" />;
      case "COLLECTED": return <CheckCircle2 className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const statusFilters: { label: string; value: FilterStatus; count: number }[] = [
    { label: "All", value: "ALL", count: allWaste.length },
    { label: "Pending", value: "PENDING", count: allWaste.filter((w) => w.status === "PENDING").length },
    { label: "In Progress", value: "IN_PROGRESS", count: allWaste.filter((w) => w.status === "IN_PROGRESS").length },
    { label: "Collected", value: "COLLECTED", count: allWaste.filter((w) => w.status === "COLLECTED").length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Package className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading pickups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Waste Pickups" subtitle={`${allWaste.filter((w) => w.status === "PENDING").length} pending · ${allWaste.filter((w) => w.status === "IN_PROGRESS").length} in progress`} />
      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-4">
        {/* Success Toast */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div ref={errorRef} className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Search */}
        <Input
          placeholder="Search by description, type, location..."
          className="h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((sf) => (
            <Button
              key={sf.value}
              size="sm"
              variant={filterStatus === sf.value ? "default" : "outline"}
              onClick={() => setFilterStatus(sf.value)}
              className="whitespace-nowrap gap-1.5"
            >
              {sf.label}
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {sf.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(["date", "quantity", "urgency", "priority"] as SortKey[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sortBy === s ? "secondary" : "ghost"}
              className="text-xs h-7 px-2.5"
              onClick={() => setSortBy(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        {/* Waste List */}
        {filteredWaste.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No pickups found</p>
            <p className="text-sm mt-1">
              {filterStatus !== "ALL"
                ? "Try changing the filter."
                : "No waste entries in the system yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWaste.map((entry) => {
              const daysOld = getDaysOld(entry.createdAt);
              const isUrgent = entry.status === "PENDING" && daysOld > 3;
              const isExpanded = expandedId === entry.id;
              const prio = priorityData[entry.id];
              const isHighPriority = prio?.priorityLevel === "HIGH";
              const isMediumPriority = prio?.priorityLevel === "MEDIUM";

              return (
                <Card
                  key={entry.id}
                  className={`overflow-hidden transition-all ${
                    isHighPriority
                      ? "border-orange-300 bg-orange-50/20"
                      : isMediumPriority
                      ? "border-amber-200 bg-amber-50/10"
                      : isUrgent
                      ? "border-red-300 bg-red-50/30"
                      : ""
                  }`}
                >
                  {/* Main Row */}
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
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getStatusColor(
                              entry.status
                            )}`}
                          >
                            {getStatusIcon(entry.status)} {entry.status.replace("_", " ")}
                          </span>
                          {prio && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                                isHighPriority
                                  ? "bg-orange-100 text-orange-800"
                                  : isMediumPriority
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <Gauge className="h-3 w-3" /> {prio.priorityLevel}
                            </span>
                          )}
                          {isUrgent && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-700 font-medium">
                              <AlertTriangle className="h-3 w-3" /> {daysOld}d old
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {entry.description}
                        </p>
                        {entry.locationAddress && (
                          <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {entry.locationAddress}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </span>
                          {entry.user?.name && (
                            <span className="text-xs text-muted-foreground">
                              by {entry.user.name}
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
                      {/* Contact Info */}
                      {entry.user?.name && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {entry.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.user.name}</p>
                            {entry.user.email && (
                              <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Full Address */}
                      {entry.locationAddress && (
                        <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{entry.locationAddress}</p>
                        </div>
                      )}

                      {/* Priority & Schedule Info */}
                      {(prio || scheduleData[entry.id] || facilityData[entry.id]) && (
                        <div className="space-y-2">
                          {/* Priority Score Bar */}
                          {prio && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <Gauge className="h-3.5 w-3.5 text-orange-600" /> Priority Score
                                </span>
                                <span className={`text-xs font-bold ${
                                  isHighPriority ? "text-orange-700" : isMediumPriority ? "text-amber-700" : "text-gray-600"
                                }`}>
                                  {prio.priorityScore.toFixed(1)} ({prio.priorityLevel})
                                </span>
                              </div>
                              <Progress
                                value={Math.min(prio.priorityScore, 100)}
                                className="h-2"
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Based on waste type, quantity ({entry.quantity}kg), age ({daysOld}d), and distance
                              </p>
                            </div>
                          )}

                          {/* Pickup Schedule */}
                          {scheduleData[entry.id] && (
                            <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                              <CalendarClock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-blue-800">Recommended Schedule</p>
                                <p className="text-xs text-blue-700 mt-0.5">
                                  {scheduleData[entry.id].pickupSchedule}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Nearest Facility */}
                          {facilityData[entry.id] && (
                            <div className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg">
                              <Building2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-purple-800">Nearest Facility</p>
                                <p className="text-xs text-purple-700 mt-0.5">
                                  {facilityData[entry.id]!.name} ({facilityData[entry.id]!.type})
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Collector Notes */}
                      {(entry.status === "PENDING" || entry.status === "IN_PROGRESS") && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Collector Notes (optional)
                          </label>
                          <Textarea
                            placeholder="Add notes about this pickup..."
                            className="text-sm min-h-[60px] resize-none"
                            value={collectorNotes[entry.id] || ""}
                            onChange={(e) =>
                              setCollectorNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-1">
                        {!isActive && (entry.status === "PENDING" || entry.status === "IN_PROGRESS") && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {accountStatus === "PENDING_APPROVAL"
                              ? "Account pending approval — actions disabled"
                              : "Account rejected — contact support"}
                          </div>
                        )}
                        {inlineError[entry.id] && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                            {inlineError[entry.id]}
                          </div>
                        )}
                        {entry.status === "PENDING" && (
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={actionLoading === entry.id || !isActive}
                            onClick={(e) => handleStatusUpdate(entry.id, "IN_PROGRESS", e)}
                          >
                            {actionLoading === entry.id ? (
                              "Claiming..."
                            ) : (
                              <>
                                <Truck className="h-4 w-4 mr-2" /> Claim Pickup
                              </>
                            )}
                          </Button>
                        )}
                        {entry.status === "IN_PROGRESS" && (
                          <Button
                            className="flex-1 bg-secondary hover:bg-secondary/90"
                            disabled={actionLoading === entry.id || !isActive}
                            onClick={(e) => handleStatusUpdate(entry.id, "COLLECTED", e)}
                          >
                            {actionLoading === entry.id ? (
                              "Completing..."
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Collected
                              </>
                            )}
                          </Button>
                        )}
                        {entry.status === "COLLECTED" && (
                          <div className="flex items-center gap-2 text-emerald-700 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>This pickup has been completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        <Card className="p-4 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredWaste.length} of {allWaste.length} entries
          </p>
        </Card>
      </div>

      {/* ── Completion Dialog (photo + GPS) ── */}
      <Dialog open={completionTarget !== null} onOpenChange={(open) => {
        if (!open) {
          setCompletionTarget(null);
          setCompletionPhoto(null);
          setCompletionPhotoPreview(null);
        }
      }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Complete Pickup</DialogTitle>
            <DialogDescription>
              Upload a photo of the collected waste. Your GPS location will be captured to verify proximity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Collection Photo <span className="text-red-500">*</span></p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              {completionPhotoPreview ? (
                <div className="relative">
                  <img
                    src={completionPhotoPreview}
                    alt="Collection"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/80"
                    onClick={() => {
                      setCompletionPhoto(null);
                      setCompletionPhotoPreview(null);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-medium">Take or Upload Photo</span>
                </button>
              )}
            </div>

            {/* Notes (optional) */}
            {completionTarget && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Notes (optional)</p>
                <Textarea
                  placeholder="Any notes about the collection..."
                  value={collectorNotes[completionTarget] || ""}
                  onChange={(e) =>
                    setCollectorNotes((prev) => ({ ...prev, [completionTarget]: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Your GPS location will be verified (must be within 200m of pickup). Please ensure location services are enabled.</span>
            </div>

            <Button
              className="w-full"
              disabled={!completionPhoto || uploadingPhoto}
              onClick={handleCompletePickup}
            >
              {uploadingPhoto ? "Uploading & Verifying..." : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Pickup</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}
