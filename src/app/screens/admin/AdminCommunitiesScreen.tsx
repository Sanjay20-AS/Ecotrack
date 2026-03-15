import { useState, useEffect } from "react";
import { Users, Trash2, Globe, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { communityAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category?: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  RECYCLING: "bg-green-100 text-green-700 border-green-200",
  COMPOSTING: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "E-WASTE": "bg-purple-100 text-purple-700 border-purple-200",
  GENERAL: "bg-blue-100 text-blue-700 border-blue-200",
};

export function AdminCommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await communityAPI.getAllCommunities();
      setCommunities(
        data.sort((a: Community, b: Community) => b.memberCount - a.memberCount)
      );
    } catch {
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete community "${name}"? This cannot be undone.`)) return;
    try {
      // Use userAPI delete user approach—communities don't have a dedicated admin delete,
      // so we call the community leave endpoint for all users isn't practical.
      // We'll use a direct DELETE via communityAPI if available, or handle the cascade.
      // The backend has DELETE via UserController cascade when creator is deleted.
      // For now we inform the admin that communities can be deleted by removing the creator.
      toast.error("To delete a community, delete its creator from the Users tab.");
    } catch {
      toast.error("Failed to delete community");
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const categories = ["ALL", "RECYCLING", "COMPOSTING", "E-WASTE", "GENERAL"];

  const filtered = communities.filter((c) =>
    filterCategory === "ALL" ? true : c.category === filterCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const totalMembers = communities.reduce((s, c) => s + c.memberCount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor all platform communities</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCommunities}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Communities</p>
          <p className="text-2xl font-bold mt-0.5">{communities.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-2xl font-bold mt-0.5">{totalMembers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Members</p>
          <p className="text-2xl font-bold mt-0.5">
            {communities.length > 0 ? Math.round(totalMembers / communities.length) : 0}
          </p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filterCategory === cat ? "default" : "outline"}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === "ALL" ? "All" : cat}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} communities</p>

      {/* Community Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No communities found</p>
          </div>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold">{c.name}</p>
                    {c.category && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${categoryColors[c.category] || "bg-gray-100 text-gray-600"}`}
                      >
                        {c.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {c.memberCount} member{c.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span>Created {formatDate(c.createdAt)}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {/* Capacity bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((c.memberCount / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
