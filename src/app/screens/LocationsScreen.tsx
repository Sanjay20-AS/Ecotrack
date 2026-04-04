import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { MapPin, Navigation, Phone, Clock, Filter, Map as MapIcon, Locate, Route, Zap, Leaf } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { facilityAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

interface Facility {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phoneNumber?: string;
  operatingHours?: string;
}

export function LocationsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [locations, setLocations] = useState<Facility[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedLocation, setSelectedLocation] = useState<Facility | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const RADIUS_KM = 50; // show facilities within 50 km

  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Fix Leaflet default markers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    fetchFacilities();
    getCurrentLocation(); // auto-detect on mount
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, filter, searchQuery, userLocation]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const facilities = await facilityAPI.getAllFacilities();
      console.log('Fetched facilities:', facilities);
      setLocations(facilities || []);
    } catch (err) {
      console.error("Failed to fetch facilities:", err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    const origin = userLocation ?? { lat: 11.0168, lng: 76.9558 };
    let filtered = locations
      .map((loc) => ({
        ...loc,
        distanceKm: haversineKm(origin.lat, origin.lng, loc.latitude, loc.longitude),
      }))
      .filter((loc) => loc.distanceKm <= RADIUS_KM);

    if (filter !== "all") {
      filtered = filtered.filter((loc) =>
        loc.type.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort nearest first
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    setFilteredLocations(filtered);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to Coimbatore if denied
          setUserLocation({ lat: 11.0168, lng: 76.9558 });
        }
      );
    } else {
      setUserLocation({ lat: 11.0168, lng: 76.9558 });
    }
  };

  const getLocationIcon = (type: string) => {
    const iconHtml: Record<string, string> = {
      'EWASTE':    '<div style="background: #2563eb; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(37,99,235,0.5); border: 3px solid white;">⚡</div>',
      'COMPOST':   '<div style="background: #059669; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(5,150,105,0.5); border: 3px solid white;">🍃</div>',
      'FOOD':      '<div style="background: #ea580c; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(234,88,12,0.5); border: 3px solid white;">🍽️</div>',
      'RECYCLER':  '<div style="background: #7c3aed; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(124,58,237,0.5); border: 3px solid white;">♻️</div>',
      'NGO':       '<div style="background: #db2777; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(219,39,119,0.5); border: 3px solid white;">🤝</div>',
      'LANDFILL':  '<div style="background: #6b7280; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 3px 8px rgba(107,114,128,0.5); border: 3px solid white;">🗑️</div>',
    };
    return L.divIcon({
      html: iconHtml[type?.toUpperCase()] || iconHtml['FOOD'],
      className: 'custom-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  const getLocationIconComponent = (type: string) => {
    switch(type?.toUpperCase()) {
      case 'EWASTE': return <Zap className="h-4 w-4" />;
      case 'COMPOST': return <Leaf className="h-4 w-4" />;
      case 'FOOD': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationColor = (type: string) => {
    switch(type?.toUpperCase()) {
      case 'EWASTE': return 'bg-blue-500';
      case 'COMPOST': return 'bg-green-500';
      case 'FOOD': return 'bg-orange-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Disposal Locations" subtitle="Recycling centers near you" />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-4">
        {/* Header info */}
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {userLocation
            ? `Showing facilities within ${RADIUS_KM} km of your location`
            : "Detecting your location..."}
        </div>
        {/* Search and Filter */}
        <div className="space-y-3">
          <Input
            placeholder="Search locations..."
            className="h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="whitespace-nowrap"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "EWASTE" ? "default" : "outline"}
              onClick={() => setFilter("EWASTE")}
              className="whitespace-nowrap"
            >
              E-waste
            </Button>
            <Button
              size="sm"
              variant={filter === "COMPOST" ? "default" : "outline"}
              onClick={() => setFilter("COMPOST")}
              className="whitespace-nowrap"
            >
              Compost
            </Button>
            <Button
              size="sm"
              variant={filter === "FOOD" ? "default" : "outline"}
              onClick={() => setFilter("FOOD")}
              className="whitespace-nowrap"
            >
              Food
            </Button>
            <Button
              size="sm"
              variant={filter === "RECYCLER" ? "default" : "outline"}
              onClick={() => setFilter("RECYCLER")}
              className="whitespace-nowrap"
            >
              Recycler
            </Button>
            <Button
              size="sm"
              variant={filter === "NGO" ? "default" : "outline"}
              onClick={() => setFilter("NGO")}
              className="whitespace-nowrap"
            >
              NGO
            </Button>
            <Button
              size="sm"
              variant={filter === "LANDFILL" ? "default" : "outline"}
              onClick={() => setFilter("LANDFILL")}
              className="whitespace-nowrap"
            >
              Landfill
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="flex-1"
          >
            List View
          </Button>
          <Button
            size="sm"
            variant={viewMode === "map" ? "default" : "outline"}
            onClick={() => setViewMode("map")}
            className="flex-1"
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="space-y-4">
            {/* Interactive Map */}
            <div className="h-96 overflow-hidden relative" style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
              <MemoizedLocationsMap
                center={userLocation ? [userLocation.lat, userLocation.lng] : [11.0168, 76.9558]}
                zoom={12}
                userLocation={userLocation}
                filteredLocations={filteredLocations}
                onSelectLocation={(l: Facility) => setSelectedLocation(l)}
                getLocationIcon={getLocationIcon}
                getLocationIconComponent={getLocationIconComponent}
              />
            </div>

            {/* Map Stats & Legend */}
            <div className="grid grid-cols-2 gap-4">
              {/* Legend */}
              <div className="bg-white/90 rounded-lg p-3 shadow-lg border">
                <div className="text-sm font-semibold mb-2">🗺️ Legend</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">⚡</div>
                    <span>E-waste Centers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">🍃</div>
                    <span>Compost Sites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">🍽️</div>
                    <span>Food Recovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-600 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">♻️</div>
                    <span>Recycler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-pink-600 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">🤝</div>
                    <span>NGO Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">🗑️</div>
                    <span>Landfill Transfer</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/90 rounded-lg p-3 shadow-lg border">
                <div className="text-sm font-semibold mb-2">📊 Statistics</div>
                <div className="text-xs space-y-1">
                  <div>Total: <span className="font-semibold">{filteredLocations.length}</span></div>
                  <div>E-waste: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'EWASTE').length}</span></div>
                  <div>Compost: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'COMPOST').length}</span></div>
                  <div>Food: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'FOOD').length}</span></div>
                  <div>Recycler: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'RECYCLER').length}</span></div>
                  <div>NGO: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'NGO').length}</span></div>
                  <div>Landfill: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'LANDFILL').length}</span></div>
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={getCurrentLocation}
                className="flex-1"
              >
                <Locate className="h-3 w-3 mr-1" />
                My Location
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`https://www.google.com/maps/search/waste+disposal+facility/@11.0168,76.9558,12z`, '_blank')}
              >
                <Route className="h-3 w-3 mr-1" />
                Directions
              </Button>
            </div>

            {/* Request Pickup for Map View */}
            <Button size="lg" className="w-full h-12" onClick={() => navigate("/app/track", { state: { pickupRequested: true } })}>
              <Navigation className="mr-2 h-5 w-5" />
              Request Pickup Service
            </Button>
          </div>
        )}

        {/* Facilities List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Facilities Near You ({filteredLocations.length})</h2>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading facilities...</div>
            ) : filteredLocations.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No facilities found matching your filters.
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLocations.map((location: any) => (
                  <Card key={location.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{location.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge>{location.type}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {location.distanceKm < 1
                                ? `${Math.round(location.distanceKm * 1000)} m`
                                : `${location.distanceKm.toFixed(1)} km`} away
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{location.address || "Address not available"}</span>
                        </div>
                        {location.phoneNumber && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${location.phoneNumber}`} className="hover:text-primary">
                              {location.phoneNumber}
                            </a>
                          </div>
                        )}
                        {location.operatingHours && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{location.operatingHours}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
                            "_blank"
                          )
                        }
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1.5" />
                        Get Directions
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Request Pickup for List View */}
            <Button size="lg" className="w-full h-12" onClick={() => navigate("/app/track", { state: { pickupRequested: true } })}>
              <Navigation className="mr-2 h-5 w-5" />
              Request Pickup Service
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Locations Map (memoized) -------------------------------
type LocationsMapProps = {
  center: [number, number];
  zoom: number;
  userLocation: { lat: number; lng: number } | null;
  filteredLocations: Facility[];
  onSelectLocation: (l: Facility) => void;
  getLocationIcon: (t: string) => L.DivIcon;
  getLocationIconComponent: (t: string) => JSX.Element;
};

function LocationsMapInner({ center, zoom, userLocation, filteredLocations, onSelectLocation, getLocationIcon }: LocationsMapProps) {
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [tileLoading, setTileLoading] = useState(true);

  function BoundsListener() {
    const map = (useMapEvents as any)({
      moveend() {
        setMapBounds((map as L.Map).getBounds());
      }
    });
    return null;
  }

  const visible = useMemo(() => {
    if (!mapBounds) return filteredLocations;
    return filteredLocations.filter((f) => mapBounds.contains(L.latLng(f.latitude, f.longitude)));
  }, [filteredLocations, mapBounds]);

  return (
    <div className="h-96 border-4 border-primary shadow-xl rounded-lg overflow-hidden relative">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          attribution={'&copy; OpenStreetMap contributors'}
          url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          updateWhenIdle={true}
          updateWhenZooming={false}
          eventHandlers={{ loading: () => setTileLoading(true), load: () => setTileLoading(false) }}
        />
        <BoundsListener />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `
                <div style="position: relative; width: 40px; height: 40px;">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(34, 197, 94, 0.3);
                    animation: pulse 1.5s ease-out infinite;
                  "></div>
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    background: #22c55e;
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    z-index: 1;
                  ">👤</div>
                </div>
                <style>
                  @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                  }
                </style>
              `,
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            })}
          >
            <Popup><div className="text-center font-semibold">You are here</div></Popup>
          </Marker>
        )}

        {visible.map((location) => (
          <Marker key={location.id} position={[location.latitude, location.longitude]} icon={getLocationIcon(location.type)} eventHandlers={{ click: () => onSelectLocation(location) }}>
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{location.name}</h3>
                </div>
                <div className="text-xs bg-primary/10 px-2 py-1 rounded">{location.type}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {tileLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="text-sm font-medium">Loading map...</div>
        </div>
      )}
    </div>
  );
}

const MemoizedLocationsMap = React.memo(LocationsMapInner);
