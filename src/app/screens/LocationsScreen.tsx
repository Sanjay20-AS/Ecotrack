import { useState } from "react";
import { MapPin, Navigation, Phone, Clock, Filter } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

export function LocationsScreen() {
  const [filter, setFilter] = useState("all");

  const locations = [
    {
      name: "Green Recycle Center",
      distance: "1.2 km",
      type: ["E-waste", "Compost"],
      address: "123 Main St, Downtown",
      phone: "(555) 123-4567",
      hours: "Mon-Fri: 9AM-6PM",
    },
    {
      name: "Community Drop-off Point",
      distance: "2.5 km",
      type: ["E-waste", "Donation"],
      address: "456 Oak Ave, Midtown",
      phone: "(555) 987-6543",
      hours: "Mon-Sat: 8AM-8PM",
    },
    {
      name: "EcoWaste Solutions",
      distance: "3.8 km",
      type: ["E-waste"],
      address: "789 Elm St, Westside",
      phone: "(555) 456-7890",
      hours: "24/7 Available",
    },
  ];

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
              variant={filter === "ewaste" ? "default" : "outline"}
              onClick={() => setFilter("ewaste")}
              className="whitespace-nowrap"
            >
              E-waste
            </Button>
            <Button
              size="sm"
              variant={filter === "compost" ? "default" : "outline"}
              onClick={() => setFilter("compost")}
              className="whitespace-nowrap"
            >
              Compost
            </Button>
            <Button
              size="sm"
              variant={filter === "donation" ? "default" : "outline"}
              onClick={() => setFilter("donation")}
              className="whitespace-nowrap"
            >
              Donation
            </Button>
          </div>
        </div>

        {/* Map Placeholder */}
        <Card className="h-48 bg-muted flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Map View</p>
          </div>
        </Card>

        {/* Request Pickup */}
        <Button size="lg" className="w-full h-12">
          <Navigation className="mr-2 h-5 w-5" />
          Request Pickup Service
        </Button>

        {/* Locations List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Nearby Locations</h2>
          <div className="space-y-3">
            {locations.map((location, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{location.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {location.type.map((type, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {location.distance}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{location.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{location.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{location.hours}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="default" size="sm" className="flex-1">
                      <Navigation className="mr-2 h-4 w-4" />
                      Directions
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
