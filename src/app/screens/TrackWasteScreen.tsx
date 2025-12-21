import { useState } from "react";
import { Camera, ScanBarcode, Calendar, MapPin, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export function TrackWasteScreen() {
  const [activeTab, setActiveTab] = useState("ewaste");

  const recentEntries = [
    { type: "E-waste", item: "Old Phone", weight: "0.5kg", date: "Dec 15" },
    { type: "Food", item: "Vegetable Scraps", weight: "1.2kg", date: "Dec 14" },
    { type: "E-waste", item: "Laptop Battery", weight: "0.3kg", date: "Dec 13" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Track Waste</h1>
        <p className="text-sm opacity-90 mt-1">Log your waste to track your impact</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="ewaste">E-waste</TabsTrigger>
            <TabsTrigger value="food">Food Waste</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {/* Camera Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="h-24 flex-col gap-2">
                <Camera className="h-8 w-8" />
                <span>Capture Photo</span>
              </Button>
              <Button size="lg" variant="secondary" className="h-24 flex-col gap-2">
                <ScanBarcode className="h-8 w-8" />
                <span>Scan Barcode</span>
              </Button>
            </div>

            {/* Form */}
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="w-full h-12 px-3 rounded-lg border bg-input-background">
                  <option>Mobile Phone</option>
                  <option>Computer</option>
                  <option>Battery</option>
                  <option>Cable</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Weight or Quantity</Label>
                <Input type="text" placeholder="e.g., 2kg or 3 items" className="h-12" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="relative">
                    <Input type="date" className="h-12" />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" className="h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location (Optional)</Label>
                <div className="relative">
                  <Input placeholder="Add location" className="h-12 pr-10" />
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <Button size="lg" className="w-full h-12">
                <Save className="mr-2 h-5 w-5" />
                Save Entry
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Entries */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Entries</h2>
          <div className="space-y-3">
            {recentEntries.map((entry, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {entry.type}
                      </span>
                      <span className="text-sm font-medium">{entry.weight}</span>
                    </div>
                    <p className="font-medium">{entry.item}</p>
                    <p className="text-sm text-muted-foreground">{entry.date}</p>
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
