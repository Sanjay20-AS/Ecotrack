import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  MapPin, Navigation, Route as RouteIcon, Clock, Package,
  CheckCircle2, Truck, Locate, Filter, Phone, Zap, Leaf, Camera, X
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
// User marker image (built into source so Vite can serve it)
const userMarkerUrl = new URL("../assets/logo-marker.svg", import.meta.url).href;
import "leaflet/dist/leaflet.css";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../components/ui/dialog";
import { wasteAPI, facilityAPI, userAPI, uploadAPI, ApiError } from "../services/apiService";
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
  user?: { id: number; name: string };
}

interface Facility {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phoneNumber?: string;
}

export function CollectorRoutesScreen() {
  const [pendingWaste, setPendingWaste] = useState<WasteEntry[]>([]);
  const [inProgressWaste, setInProgressWaste] = useState<WasteEntry[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFacilities, setShowFacilities] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedPickup, setSelectedPickup] = useState<WasteEntry | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [completionTarget, setCompletionTarget] = useState<number | null>(null);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<WasteEntry[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const userId = parseInt(localStorage.getItem("userId") || "0");

  // Fix Leaflet default markers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  useEffect(() => {
    loadRouteData();
    getCurrentLocation();
    // Check account status
    userAPI.getUserById(userId).then((u: any) => {
      setIsActive(u.accountStatus === "ACTIVE");
    }).catch(() => {});
  }, []);

  const loadRouteData = async () => {
    try {
      const [pending, inProgress, facs] = await Promise.all([
        wasteAPI.getWasteByStatus("PENDING").catch(() => []),
        wasteAPI.getWasteByStatus("IN_PROGRESS").catch(() => []),
        facilityAPI.getActiveFacilities().catch(() => []),
      ]);
      setPendingWaste(pending);
      setInProgressWaste(inProgress);
      setFacilities(facs);
      // loaded inProgressWaste
    } catch (err) {
      console.error("Route data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 11.0168, lng: 76.9558 }) // fallback Coimbatore
      );
    } else {
      setUserLocation({ lat: 11.0168, lng: 76.9558 });
    }
  };

  const computeOptimizedRoute = () => {
    const picks = [...inProgressWaste, ...pendingWaste].filter(
      (w) => w.locationLatitude && w.locationLongitude
    );
    if (picks.length === 0) {
      toast("No pickups with GPS coordinates to optimize.");
      return;
    }
    const start = userLocation ?? { lat: 11.0168, lng: 76.9558 };
    // Build an initial route using nearest-neighbor, then improve it with 2-opt
    const initial = nearestNeighbor(picks, start.lat, start.lng);
    const initialExact = totalRouteKm(initial, start.lat, start.lng);
    const improved = twoOptImprove(initial, start.lat, start.lng);
    const improvedExact = totalRouteKm(improved, start.lat, start.lng);
    // Round for display, but compute saved from full-precision values to avoid small diffs vanishing
    const initialKm = Math.round(initialExact * 100) / 100;
    const improvedKm = Math.round(improvedExact * 100) / 100;
    setOptimizedRoute(improved);
    setIsOptimized(true);
    const saved = Math.max(0, Math.round((initialExact - improvedExact) * 100) / 100);
    toast.success(`Route optimized — ${picks.length} stops · ${improvedKm} km (${saved} km saved)`);
  };

  const handleClaim = async (wasteId: number) => {
    if (!isActive) {
      toast.error("Your account is not active. Admin approval required.");
      return;
    }
    setActionLoading(wasteId);
    try {
      await wasteAPI.updateWasteStatus(wasteId, "IN_PROGRESS", userId);
      await loadRouteData();
      setSelectedPickup(null);
      toast.success("Pickup claimed!");
    } catch (err) {
      console.error("Claim failed:", err);
      toast.error("Failed to claim pickup.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCollect = async (wasteId: number) => {
    if (!isActive) {
      toast.error("Your account is not active. Admin approval required.");
      return;
    }
    // Open completion dialog instead of direct API call
    setCompletionTarget(wasteId);
    setCompletionPhoto(null);
    setCompletionPhotoPreview(null);
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
    try {
      const uploadResult = await uploadAPI.uploadWasteImage(completionPhoto);
      const gps = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("Geolocation not supported.")); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject(new Error("Failed to get location. Enable GPS and try again.")),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
      await wasteAPI.updateWasteStatus(completionTarget, "COLLECTED", userId, undefined, {
        collectionPhotoUrl: uploadResult.url,
        collectorLatitude: gps.lat,
        collectorLongitude: gps.lng,
      });
      toast.success("Marked as collected!");
      setCompletionTarget(null);
      setCompletionPhoto(null);
      setCompletionPhotoPreview(null);
      setSelectedPickup(null);
      await loadRouteData();
    } catch (err: any) {
      const data = err instanceof ApiError ? err.data : null;
      toast.error(data?.error || err?.message || "Failed to complete pickup.");
      console.error("Collect failed:", err);
    } finally {
      setUploadingPhoto(false);
      setActionLoading(null);
    }
  };

  // All pickups with valid coordinates
  const hasValidCoords = (w: WasteEntry) =>
    w.locationLatitude !== undefined && w.locationLatitude !== null && w.locationLongitude !== undefined && w.locationLongitude !== null &&
    !isNaN(Number(w.locationLatitude)) && !isNaN(Number(w.locationLongitude));

  const allPickups = [...inProgressWaste, ...pendingWaste].filter((w) => hasValidCoords(w));

  // Route display order (optimized or natural)
  const displayRoute = isOptimized ? optimizedRoute : allPickups;

  // Map center
  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : allPickups.length > 0
    ? [allPickups[0].locationLatitude!, allPickups[0].locationLongitude!]
    : [11.0168, 76.9558];

  // Route polyline follows display order
  const startPt = userLocation ?? { lat: 11.0168, lng: 76.9558 };
  const routePoints: [number, number][] = displayRoute.length > 0
    ? [[startPt.lat, startPt.lng], ...displayRoute.map((w) => [w.locationLatitude!, w.locationLongitude!] as [number, number])]
    : [];

  // Ensure pickups in progress are always shown on the map (even if not in the current display list)
  const visiblePickups = (() => {
    const base = (isOptimized ? optimizedRoute.slice() : allPickups.slice());
    const inProg = inProgressWaste.filter((w) => hasValidCoords(w));
    for (const p of inProg) {
      if (!base.find((b) => b.id === p.id)) {
        // put in-progress pickups at the front so they're visible
        base.unshift(p);
      }
    }
    return base;
  })();

  // If multiple pickups share the exact same coordinates, apply a small radial offset
  // so markers don't completely overlap. Offsets are deterministic based on index.
  const adjustedPositions = (() => {
    const groups: Record<string, WasteEntry[]> = {};
    for (const p of visiblePickups) {
      const key = `${p.locationLatitude},${p.locationLongitude}`;
      groups[key] = groups[key] || [];
      groups[key].push(p);
    }
    const posMap: Record<number, [number, number]> = {};
    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length === 1) {
        const p = group[0];
        posMap[p.id] = [p.locationLatitude!, p.locationLongitude!];
        continue;
      }
      const baseLat = group[0].locationLatitude!;
      const baseLng = group[0].locationLongitude!;
      const radiusDeg = 0.00012; // ~13m, small offset
      for (let i = 0; i < group.length; i++) {
        const angle = (2 * Math.PI * i) / group.length;
        const dLat = Math.cos(angle) * radiusDeg;
        const dLng = Math.sin(angle) * radiusDeg / Math.cos((baseLat * Math.PI) / 180);
        posMap[group[i].id] = [baseLat + dLat, baseLng + dLng];
      }
    }
    return posMap;
  })();

  // Route stats
  const estDistanceKm = displayRoute.length > 0
    ? Math.round(totalRouteKm(displayRoute, startPt.lat, startPt.lng) * 10) / 10
    : 0;
  const etaMinutes = Math.round(estDistanceKm * 3); // ~20 km/h avg speed

  // Numbered marker icon for optimized route (colored by pickup type)
  const createNumberedIcon = (num: number, pickup: WasteEntry) => {
    const t = (pickup.type || "").toUpperCase();
    const color = t.includes("E-WASTE") || t.includes("EWASTE") ? "#EF4444" // red for E-waste
      : t.includes("FOOD") ? "#22C55E" // green for food
      : "#2563eb"; // default blue
    const label = `${pickup.type} ${typeof pickup.quantity === 'number' ? (Math.round(pickup.quantity*10)/10) : pickup.quantity}kg`;
    return L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;">
          <div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">${num}</div>
          <div style="margin-top:4px;font-size:11px;color:#064e3b;font-weight:600;text-align:center;white-space:nowrap;">${label}</div>
        </div>
      `,
      className: "custom-marker-icon",
      iconSize: [32, 44],
      iconAnchor: [16, 16],
      popupAnchor: [0, -22],
    });
  };

  // Marker icons (non-optimized display: compact 32px markers)
  const createPickupIcon = (status: string, type: string) => {
    const color = status === "IN_PROGRESS" ? "#2563eb" : "#f59e0b";
    const emoji = type === "E-WASTE" ? "⚡" : type === "FOOD" ? "🍽️" : "♻️";
    return L.divIcon({
      html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;font-weight:700;">${emoji}</div>`,
      className: "custom-marker-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // Special marker for pickups that are currently in progress
  const createInProgressIcon = (pickup: WasteEntry, num?: number, isOptimized?: boolean) => {
    const label = `${pickup.type} ${typeof pickup.quantity === 'number' ? (Math.round(pickup.quantity*10)/10) : pickup.quantity}kg`;
    const inner = (isOptimized && typeof num === 'number' && num > 0) ? String(num) : '🚛';
    return L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;">
          <style>@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }</style>
          <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:42px;height:42px;border-radius:50%;background:rgba(37,99,235,0.12);border:2px solid rgba(37,99,235,0.2);animation: pulse 1.6s infinite;"></div>
            <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-shadow:0 4px 10px rgba(37,99,235,0.25);">${inner}</div>
          </div>
          <div style="margin-top:4px;font-size:11px;color:#0f172a;font-weight:600;text-align:center;white-space:nowrap;">${label}</div>
        </div>
      `,
      className: "custom-marker-icon",
      iconSize: [42, 52],
      iconAnchor: [21, 21],
      popupAnchor: [0, -30],
    });
  };

  const facilityIcon = (type: string) => {
    const t = (type || "").toUpperCase();
    const colors: Record<string, string> = {
      EWASTE: "#059669",
      COMPOST: "#10B981",
      FOOD: "#EA580C",
      RECYCLING: "#0EA5A4",
      DEFAULT: "#6B7280",
    };
    const bg = colors[t] || colors.DEFAULT;
    // Choose a distinct emoji/symbol per facility type for easier scanning
    const emoji = t.includes("EWASTE") || t.includes("E-WASTE") ? "🔌"
      : t.includes("FOOD") ? "🍽️"
      : t.includes("COMPOST") ? "🍃"
      : t.includes("RECYCL") ? "♻️"
      : "🏭";
    return L.divIcon({
      html: `<div style="background:${bg};color:white;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px ${bg}60;border:2px solid white;">${emoji}</div>`,
      className: "custom-marker-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  const userIcon = L.divIcon({
    className: "collector-location-icon",
    html: `
      <div style="position:relative;width:64px;height:64px;display:flex;align-items:center;justify-content:center;flex-direction:column">
        <style>
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
          .collector-marker-ring { position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.25); animation: pulse 1.8s infinite; }
          .collector-marker-inner { position:relative;width:34px;height:34px;border-radius:50%;background:#10B981;color:white;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 4px 10px rgba(16,185,129,0.35); }
          .collector-marker-label { margin-top:6px;font-size:11px;color:#065f46;font-weight:600;text-align:center;text-shadow:0 1px 0 rgba(255,255,255,0.6); }
        </style>
        <div class="collector-marker-ring"></div>
        <div class="collector-marker-inner">👤</div>
        <div class="collector-marker-label">You are here</div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -40],
  });

  // Find pickups that lack GPS coordinates so we can surface them to the user
  const pickupsMissingCoords = [...inProgressWaste, ...pendingWaste].filter((w) => !hasValidCoords(w));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <RouteIcon className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <TopBar variant="banner" title="Collection Routes" subtitle={`${inProgressWaste.length} active · ${pendingWaste.length} pending pickups`} />

      <div className="px-6 py-5 space-y-4">
        {/* Route Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{pendingWaste.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <Truck className="h-5 w-5 text-secondary mx-auto mb-1" />
            <p className="text-xl font-bold">{inProgressWaste.length}</p>
            <p className="text-xs text-muted-foreground">In Route</p>
          </Card>
          <Card className="p-3 text-center">
            <MapPin className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold">{facilities.length}</p>
            <p className="text-xs text-muted-foreground">Facilities</p>
          </Card>
        </div>

        {/* Route Optimizer */}
        {allPickups.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Route Optimizer</span>
                {isOptimized && <Badge className="bg-primary text-xs">Optimized</Badge>}
              </div>
              <Button
                size="sm"
                variant={isOptimized ? "outline" : "default"}
                onClick={isOptimized ? () => setIsOptimized(false) : computeOptimizedRoute}
                className="gap-1.5"
              >
                {isOptimized ? "Reset Order" : <><Zap className="h-3.5 w-3.5" /> Optimize Route</>}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold text-base">{displayRoute.length}</p>
                <p className="text-muted-foreground">Stops</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold text-base">{estDistanceKm} km</p>
                <p className="text-muted-foreground">Est. Distance</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="font-bold text-base">{etaMinutes} min</p>
                <p className="text-muted-foreground">Est. Time</p>
              </div>
            </div>
          </Card>
        )}

        {pickupsMissingCoords.length > 0 && (
          <Card className="p-3 border-2 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{pickupsMissingCoords.length} pickup(s) missing GPS</p>
                <p className="text-xs text-muted-foreground">Some active pickups don't have location coordinates and won't appear on the map.</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {pickupsMissingCoords.slice(0,3).map(p => (
                  <div key={p.id}>{p.type} — {p.quantity}kg</div>
                ))}
              </div>
            </div>
          </Card>
        )}

        

        {/* Toggle facilities */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showFacilities ? "default" : "outline"}
            onClick={() => setShowFacilities(!showFacilities)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            {showFacilities ? "Hide" : "Show"} Facilities
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={getCurrentLocation}
            className="gap-1.5"
          >
            <Locate className="h-3.5 w-3.5" />
            My Location
          </Button>
        </div>

        {/* Map */}
        <Card className="overflow-hidden rounded-2xl border-2">
          <div style={{ height: 380 }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />

              {/* User location */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userIcon}
                >
                  <Popup>📍 Your Location</Popup>
                </Marker>
              )}

              {/* Pickup markers */}
              {visiblePickups.map((pickup, idx) => {
                // compute the displayed number when optimized (use optimizedRoute order)
                const num = isOptimized ? (optimizedRoute.findIndex((r) => r.id === pickup.id) + 1) : idx + 1;
                // ensure IN_PROGRESS pickups use a clearly visible marker
                const markerIcon = pickup.status === "IN_PROGRESS"
                  ? createInProgressIcon(pickup, num, isOptimized)
                  : (isOptimized ? createNumberedIcon(num, pickup) : createPickupIcon(pickup.status, pickup.type));
                return (
                  <Marker
                    key={pickup.id}
                    position={adjustedPositions[pickup.id] || [pickup.locationLatitude!, pickup.locationLongitude!]}
                    icon={markerIcon}
                    zIndexOffset={pickup.status === "IN_PROGRESS" ? 1000 : 0}
                    eventHandlers={{ click: () => setSelectedPickup(pickup) }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{pickup.type}</strong> — {pickup.quantity} kg
                        <br />
                        <span className="text-xs">{pickup.description}</span>
                        <br />
                        <Badge className="mt-1 text-xs">{pickup.status}</Badge>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Facility markers */}
              {showFacilities &&
                facilities.map((fac) => (
                  <Marker
                    key={`fac-${fac.id}`}
                    position={[fac.latitude, fac.longitude]}
                    icon={facilityIcon(fac.type)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{fac.name}</strong>
                        <br />
                        <span className="text-xs">{fac.type}</span>
                        {fac.address && (
                          <>
                            <br />
                            <span className="text-xs">{fac.address}</span>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* Route polyline */}
              {routePoints.length > 1 && (
                <Polyline
                  positions={routePoints}
                  pathOptions={{
                    color: "#2563eb",
                    weight: 4,
                    dashArray: "10, 8",
                    opacity: 0.8,
                  }}
                />
              )}
            </MapContainer>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" /> Facility
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block border-2 border-white" /> You
          </span>
        </div>

        {/* Selected Pickup Action Card */}
        {selectedPickup && (
          <Card className="p-4 border-2 border-accent bg-accent/10">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedPickup.type}</Badge>
                  <span className="font-bold">{selectedPickup.quantity} kg</span>
                  <Badge className={selectedPickup.status === "IN_PROGRESS" ? "bg-secondary" : "bg-warning"}>
                    {selectedPickup.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm">{selectedPickup.description}</p>
                {selectedPickup.locationAddress && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedPickup.locationAddress}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setSelectedPickup(null)}
              >
                ✕
              </Button>
            </div>
            <div className="flex gap-2">
              {selectedPickup.status === "PENDING" && (
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={actionLoading === selectedPickup.id || !isActive}
                  onClick={() => handleClaim(selectedPickup.id)}
                >
                  {actionLoading === selectedPickup.id ? "Claiming..." : (
                    <><Truck className="h-4 w-4 mr-2" /> Claim Pickup</>
                  )}
                </Button>
              )}
              {selectedPickup.status === "IN_PROGRESS" && (
                <Button
                  className="flex-1 bg-secondary hover:bg-secondary/90"
                  disabled={actionLoading === selectedPickup.id || !isActive}
                  onClick={() => handleCollect(selectedPickup.id)}
                >
                  {actionLoading === selectedPickup.id ? "Completing..." : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Collected</>
                  )}
                </Button>
              )}
              {selectedPickup.locationLatitude && selectedPickup.locationLongitude && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedPickup.locationLatitude},${selectedPickup.locationLongitude}`,
                      "_blank"
                    )
                  }
                >
                  <Navigation className="h-4 w-4 mr-1" /> Navigate
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Pickup List below map */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {isOptimized ? "Optimized Route" : "Active Pickups"} ({displayRoute.length})
          </h2>
          {displayRoute.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">All clear!</p>
              <p className="text-sm">No active pickups on the map.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {displayRoute.slice(0, 8).map((entry, idx) => {
                const prevLat = idx === 0 ? startPt.lat : displayRoute[idx - 1].locationLatitude;
                const prevLng = idx === 0 ? startPt.lng : displayRoute[idx - 1].locationLongitude;
                const distKm =
                  entry.locationLatitude && entry.locationLongitude && prevLat && prevLng
                    ? Math.round(haversineKm(prevLat, prevLng, entry.locationLatitude, entry.locationLongitude) * 10) / 10
                    : null;
                return (
                  <Card
                    key={entry.id}
                    className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                      selectedPickup?.id === entry.id ? "ring-2 ring-primary" : ""
                    } ${entry.status === "IN_PROGRESS" ? "border-accent bg-accent/10" : ""}`}
                    onClick={() => setSelectedPickup(entry)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isOptimized && (
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.type}
                            </Badge>
                            <span className="text-sm font-bold">{entry.quantity} kg</span>
                            <span
                              className={`text-xs font-medium ${
                                entry.status === "IN_PROGRESS" ? "text-secondary" : "text-warning"
                              }`}
                            >
                              {entry.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {entry.locationAddress || entry.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{entry.locationLatitude ?? '—'}, {entry.locationLongitude ?? '—'}</p>
                          {isOptimized && distKm !== null && (
                            <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                              <RouteIcon className="h-3 w-3" />
                              {distKm} km from {idx === 0 ? "your location" : `stop ${idx}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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
              Upload a photo of the collected waste. Your GPS will be verified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  <img src={completionPhotoPreview} alt="Collection" className="w-full h-48 object-cover rounded-lg border" />
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 bg-white/80"
                    onClick={() => { setCompletionPhoto(null); setCompletionPhotoPreview(null); }}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-medium">Take or Upload Photo</span>
                </button>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Your GPS location will be verified (must be within 200m of pickup).</span>
            </div>
            <Button className="w-full" disabled={!completionPhoto || uploadingPhoto} onClick={handleCompletePickup}>
              {uploadingPhoto ? "Uploading & Verifying..." : (<><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Pickup</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Route optimization helpers ──────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighbor(pickups: WasteEntry[], startLat: number, startLng: number): WasteEntry[] {
  const remaining = [...pickups];
  const route: WasteEntry[] = [];
  let curLat = startLat;
  let curLng = startLng;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(curLat, curLng, remaining[i].locationLatitude!, remaining[i].locationLongitude!);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    route.push(next);
    curLat = next.locationLatitude!;
    curLng = next.locationLongitude!;
  }
  return route;
}

// 2-opt local improvement: repeatedly try swapping two edges to reduce route length
function twoOptImprove(route: WasteEntry[], startLat: number, startLng: number): WasteEntry[] {
  if (route.length < 3) return route;
  let improved = true;
  let bestRoute = [...route];
  let bestDist = totalRouteKm(bestRoute, startLat, startLng);
  while (improved) {
    improved = false;
    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        const newRoute = twoOptSwap(bestRoute, i, k);
        const newDist = totalRouteKm(newRoute, startLat, startLng);
        if (newDist + 1e-6 < bestDist) {
          bestRoute = newRoute;
          bestDist = newDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  return bestRoute;
}

function twoOptSwap(route: WasteEntry[], i: number, k: number): WasteEntry[] {
  const newRoute = route.slice(0, i)
    .concat(route.slice(i, k + 1).reverse())
    .concat(route.slice(k + 1));
  return newRoute;
}

function totalRouteKm(pickups: WasteEntry[], startLat: number, startLng: number): number {
  let total = 0;
  let curLat = startLat;
  let curLng = startLng;
  for (const p of pickups) {
    total += haversineKm(curLat, curLng, p.locationLatitude!, p.locationLongitude!);
    curLat = p.locationLatitude!;
    curLng = p.locationLongitude!;
  }
  return total;
}
