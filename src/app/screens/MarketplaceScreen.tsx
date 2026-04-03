import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, Tag, User, AlertCircle, RefreshCw, Package } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { marketplaceAPI } from "../services/apiService";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";

const CATEGORIES = ["ALL", "ELECTRONICS", "FURNITURE", "CLOTHING", "BOOKS", "APPLIANCES", "OTHER"];
const CONDITIONS = ["WORKING", "GOOD", "FAIR", "POOR"];
const CONDITION_LABELS: Record<string, string> = { WORKING: "Working", GOOD: "Good", FAIR: "Fair", POOR: "Poor" };
const CATEGORY_ICONS: Record<string, string> = {
  ELECTRONICS: "💻", FURNITURE: "🪑", CLOTHING: "👕", BOOKS: "📚",
  APPLIANCES: "🏠", OTHER: "📦", ALL: "🛒",
};
const CONDITION_COLORS: Record<string, string> = {
  WORKING: "bg-green-100 text-green-700", GOOD: "bg-blue-100 text-blue-700",
  FAIR: "bg-yellow-100 text-yellow-700", POOR: "bg-red-100 text-red-700",
};

interface ListingItem {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  isFree: boolean;
  currency: string;
  imageUrl?: string;
  status: string;
  seller: { id: number; name: string; email: string };
  createdAt: string;
}

export function MarketplaceScreen() {
  const userId = parseInt(localStorage.getItem("userId") ?? "0");

  const [allItems, setAllItems] = useState<ListingItem[]>([]);
  const [myItems, setMyItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "OTHER", condition: "GOOD",
    price: "", isFree: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [all, mine] = await Promise.all([
        marketplaceAPI.getAll(),
        userId ? marketplaceAPI.getMine(userId) : Promise.resolve([]),
      ]);
      setAllItems(all);
      setMyItems(mine);
    } catch {
      setError("Failed to load marketplace listings.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = allItems.filter((item) => {
    const matchCat = activeCategory === "ALL" || item.category === activeCategory;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setCreating(true);
    try {
      await marketplaceAPI.create({
        sellerId: userId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        price: form.isFree ? 0 : parseFloat(form.price) || 0,
        isFree: form.isFree,
      });
      toast.success("Listing created successfully!");
      setShowCreate(false);
      setForm({ title: "", description: "", category: "OTHER", condition: "GOOD", price: "", isFree: false });
      await loadData();
    } catch {
      toast.error("Failed to create listing.");
    } finally {
      setCreating(false);
    }
  };

  const handleMarkSold = async (id: number) => {
    try {
      await marketplaceAPI.update(id, { status: "SOLD" });
      toast.success("Item marked as sold!");
      await loadData();
    } catch {
      toast.error("Could not update item status.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await marketplaceAPI.delete(id);
      toast.success("Listing removed.");
      await loadData();
    } catch {
      toast.error("Could not remove listing.");
    }
  };

  const ItemCard = ({ item, isMine }: { item: ListingItem; isMine?: boolean }) => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => !isMine && setSelectedItem(item)}
    >
      <div className="aspect-square bg-muted flex items-center justify-center text-5xl relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span>{CATEGORY_ICONS[item.category] ?? "📦"}</span>
        )}
        {item.isFree && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">FREE</span>
        )}
        {item.status === "SOLD" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SOLD</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h3>
        <div className="flex items-center gap-1 mb-2">
          {item.condition && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CONDITION_COLORS[item.condition] ?? ""}`}>
              {CONDITION_LABELS[item.condition] ?? item.condition}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {item.isFree ? "Free" : `₹${item.price.toFixed(0)}`}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {item.seller?.name ?? "Unknown"}
          </span>
        </div>
        {isMine && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {item.status === "AVAILABLE" && (
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handleMarkSold(item.id); }}>
                Mark Sold
              </Button>
            )}
            <Button size="sm" variant="ghost" className="flex-1 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
              Remove
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar variant="banner" title="Marketplace" subtitle="Share, donate, or swap reusable items" />

      <div className="px-6 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              className="whitespace-nowrap flex-shrink-0"
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mylistings">My Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading listings...</div>
            ) : error ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No listings found</p>
                {search && <Button variant="link" onClick={() => setSearch("")}>Clear search</Button>}
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mylistings" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading your listings...</div>
            ) : myItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No listings yet</p>
                <Button onClick={() => setShowCreate(true)}>Add Your First Item</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myItems.map((item) => <ItemCard key={item.id} item={item} isMine />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Create Button */}
      <Button
        size="lg"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm h-12 shadow-lg"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="mr-2 h-5 w-5" />List an Item
      </Button>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left text-xl">{selectedItem.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-7xl overflow-hidden">
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>{CATEGORY_ICONS[selectedItem.category] ?? "📦"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-primary">
                    {selectedItem.isFree ? "Free" : `₹${selectedItem.price.toFixed(0)}`}
                  </span>
                  {selectedItem.condition && (
                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[selectedItem.condition] ?? ""}`}>
                      {CONDITION_LABELS[selectedItem.condition]}
                    </span>
                  )}
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {selectedItem.category.charAt(0) + selectedItem.category.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{selectedItem.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
                  <User className="h-4 w-4" />
                  <span>Listed by <strong>{selectedItem.seller?.name}</strong></span>
                  <span>·</span>
                  <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                </div>
                <Button className="w-full h-12" onClick={() => {
                  toast.success(`Contact ${selectedItem.seller?.name} at ${selectedItem.seller?.email}`);
                }}>
                  Contact Seller
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>List an Item</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Samsung Galaxy S20"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the item, its condition, and any details..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{CONDITION_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Price (₹)</Label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFree}
                    onChange={(e) => setForm((f) => ({ ...f, isFree: e.target.checked, price: "" }))}
                    className="w-4 h-4"
                  />
                  Giving away for free
                </label>
              </div>
              {!form.isFree && (
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? "Listing..." : "List Item"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

