import { useState, useEffect } from "react";
import { Package, Search, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { wasteAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface WasteItem {
  id: number;
  type: string;
  quantity: number;
  description: string;
  status: string;
  createdAt: string;
  locationAddress?: string;
  user?: { id: number; name: string };
  collectedBy?: { id: number; name: string };
}

export function AdminWasteScreen() {
  const [allWaste, setAllWaste] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wasteSearch, setWasteSearch] = useState("");
  const [wasteFilter, setWasteFilter] = useState("ALL");

  useEffect(() => {
    loadWaste();
  }, []);

  const loadWaste = async () => {
    setLoading(true);
    try {
      const data = await wasteAPI.getAllWaste();
      setAllWaste(
        data.sort((a: WasteItem, b: WasteItem) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      toast.error("Failed to load waste records");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWaste = async (wasteId: number) => {
    try {
      await wasteAPI.deleteWaste(wasteId);
      toast.success("Waste record deleted");
      loadWaste();
    } catch {
      toast.error("Failed to delete waste record");
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const filteredWaste = allWaste.filter((w) => {
    const matchesSearch =
      w.type?.toLowerCase().includes(wasteSearch.toLowerCase()) ||
      w.description?.toLowerCase().includes(wasteSearch.toLowerCase()) ||
      w.locationAddress?.toLowerCase().includes(wasteSearch.toLowerCase());
    const matchesStatus = wasteFilter === "ALL" || w.status === wasteFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    ALL: allWaste.length,
    PENDING: allWaste.filter((w) => w.status === "PENDING").length,
    IN_PROGRESS: allWaste.filter((w) => w.status === "IN_PROGRESS").length,
    COLLECTED: allWaste.filter((w) => w.status === "COLLECTED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Waste Records</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage all waste submissions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by type, description, or location..."
            value={wasteSearch}
            onChange={(e) => setWasteSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "IN_PROGRESS", "COLLECTED"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={wasteFilter === f ? "default" : "outline"}
              onClick={() => setWasteFilter(f)}
            >
              {f === "ALL" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredWaste.length} records</p>

      <div className="space-y-3">
        {filteredWaste.map((w) => (
          <Card key={w.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="font-medium">{w.type}</Badge>
                  <WasteStatusBadge status={w.status} />
                  <span className="text-sm font-semibold">{w.quantity} kg</span>
                </div>
                {w.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{w.description}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {w.user && <p>Donor: <span className="font-medium text-foreground">{w.user.name}</span> (#{w.user.id})</p>}
                  {w.collectedBy && <p>Collector: <span className="font-medium text-foreground">{w.collectedBy.name}</span> (#{w.collectedBy.id})</p>}
                  {w.locationAddress && <p>📍 {w.locationAddress}</p>}
                  <p>Submitted: {formatDate(w.createdAt)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => handleDeleteWaste(w.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {filteredWaste.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No waste records found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WasteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    IN_PROGRESS: { label: "In Progress", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    COLLECTED: { label: "Collected", cls: "bg-green-100 text-green-700 border-green-200" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <Badge variant="outline" className={`text-xs px-1.5 py-0 ${s.cls}`}>{s.label}</Badge>;
}
