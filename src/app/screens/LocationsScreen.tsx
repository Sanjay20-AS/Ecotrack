import { useState, useEffect } from "react";
import { MapPin, Navigation, Phone, Clock, Filter, Map as MapIcon, Locate, Route, Zap, Leaf } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { facilityAPI } from "../services/apiService";

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
  const [filter, setFilter] = useState("all");
  const [locations, setLocations] = useState<Facility[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedLocation, setSelectedLocation] = useState<Facility | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, filter, searchQuery]);

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
    let filtered = locations;

    if (filter !== "all") {
      filtered = filtered.filter((loc: Facility) =>
        loc.type.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((loc: Facility) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const getLocationIcon = (type: string) => {
    const iconHtml = {
      'EWASTE': '<div style="background: #3b82f6; color: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">⚡</div>',
      'COMPOST': '<div style="background: #10b981; color: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">🍃</div>',
      'FOOD': '<div style="background: #f97316; color: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">📍</div>',
    };
    
    return L.divIcon({
      html: iconHtml[type?.toUpperCase() as keyof typeof iconHtml] || iconHtml.FOOD,
      className: 'custom-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
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
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Disposal Locations</h1>
        <p className="text-sm opacity-90 mt-1">Find recycling centers near you</p>
      </div>

      <div className="px-6 py-6 space-y-4">
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
              Food/Recycler
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

        {/* Debug Info */}
        <div className="text-xs text-gray-500 text-center">
          View Mode: {viewMode} | Facilities: {filteredLocations.length} | Total: {locations.length}
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="space-y-4">
            {/* Interactive Map */}
            <div className="h-96 border-4 border-primary shadow-xl rounded-lg overflow-hidden">
              <MapContainer
                center={[12.9716, 77.5946]} // Bangalore, India
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User Location Marker */}
                {userLocation && (
                  <Marker 
                    position={[userLocation.lat, userLocation.lng]}
                    icon={L.divIcon({
                      html: '<div style="background: #2563eb; color: white; border-radius: 50%; padding: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;">📍</div>',
                      className: 'user-location-icon',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  >
                    <Popup>
                      <div className="text-center font-semibold">📍 You are here</div>
                    </Popup>
                  </Marker>
                )}

                {/* Facility Markers */}
                {filteredLocations.map((location: Facility) => (
                  <Marker 
                    key={location.id}
                    position={[location.latitude, location.longitude]} 
                    icon={getLocationIcon(location.type)}
                    eventHandlers={{
                      click: () => setSelectedLocation(location)
                    }}
                  >
                    <Popup>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {getLocationIconComponent(location.type)}
                          <h3 className="font-semibold">{location.name}</h3>
                        </div>
                        <div className="text-xs bg-primary/10 px-2 py-1 rounded">{location.type}</div>
                        {location.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span>{location.address}</span>
                          </div>
                        )}
                        {location.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${location.phoneNumber}`} className="text-blue-600 hover:underline">
                              {location.phoneNumber}
                            </a>
                          </div>
                        )}
                        {location.operatingHours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3" />
                            <span>{location.operatingHours}</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
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
                    <div className="bg-orange-500 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs">📍</div>
                    <span>Food/Recycler</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/90 rounded-lg p-3 shadow-lg border">
                <div className="text-sm font-semibold mb-2">📊 Statistics</div>
                <div className="text-xs space-y-1">
                  <div>Total Facilities: <span className="font-semibold">{filteredLocations.length}</span></div>
                  <div>E-waste: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'EWASTE').length}</span></div>
                  <div>Compost: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'COMPOST').length}</span></div>
                  <div>Food: <span className="font-semibold">{filteredLocations.filter(f => f.type === 'FOOD').length}</span></div>
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
                onClick={() => window.open(`https://www.google.com/maps/search/waste+disposal+facility/@12.9716,77.5946,12z`, '_blank')}
              >
                <Route className="h-3 w-3 mr-1" />
                Directions
              </Button>
            </div>

            {/* Request Pickup for Map View */}
            <Button size="lg" className="w-full h-12">
              <Navigation className="mr-2 h-5 w-5" />
              Request Pickup Service
            </Button>
          </div>
        )}

        {/* Facilities List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Facilities Near You</h2>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading facilities...</div>
            ) : filteredLocations.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No facilities found matching your filters.
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLocations.map((location: Facility) => (
                  <Card key={location.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{location.name}</h3>
                          <Badge className="mt-1">{location.type}</Badge>
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

                      <Button size="sm" className="w-full mt-2">
                        Get Directions
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Request Pickup for List View */}
            <Button size="lg" className="w-full h-12">
              <Navigation className="mr-2 h-5 w-5" />
              Request Pickup Service
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
