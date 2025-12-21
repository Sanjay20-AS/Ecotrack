import { Search, Heart, Plus } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export function MarketplaceScreen() {
  const items = [
    { title: "Vintage Laptop", distance: "2.3 km", image: "💻", category: "Electronics" },
    { title: "Office Chair", distance: "1.5 km", image: "🪑", category: "Furniture" },
    { title: "Books Collection", distance: "0.8 km", image: "📚", category: "Books" },
    { title: "Garden Tools", distance: "3.2 km", image: "🛠️", category: "Tools" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-secondary text-secondary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Resource Marketplace</h1>
        <p className="text-sm opacity-90 mt-1">Share, donate, or swap reusable items</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-11 h-12" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {["All", "Electronics", "Furniture", "Books", "Clothes", "Tools"].map((cat) => (
            <Button key={cat} size="sm" variant="outline" className="whitespace-nowrap">
              {cat}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mylistings">My Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {items.map((item, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center text-6xl">
                    {item.image}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{item.distance} away</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mylistings" className="mt-4">
            <Card className="p-8 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No listings yet</p>
              <Button>Add Your First Item</Button>
            </Card>
          </TabsContent>
        </Tabs>

        <Button size="lg" className="w-full h-12 fixed bottom-20 left-6 right-6 max-w-md mx-auto shadow-lg">
          <Plus className="mr-2 h-5 w-5" />
          List an Item
        </Button>
      </div>
    </div>
  );
}
