import { useState, useEffect, useCallback } from "react";
import { BookOpen, Video, Eye, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { educationAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

const CATEGORIES = ["ALL", "WASTE_MANAGEMENT", "RECYCLING", "COMPOSTING", "E-WASTE", "TIPS"];
const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Topics", WASTE_MANAGEMENT: "Waste Management", RECYCLING: "Recycling",
  COMPOSTING: "Composting", "E-WASTE": "E-Waste", TIPS: "Eco Tips",
};
const CATEGORY_ICONS: Record<string, string> = {
  ALL: "📚", WASTE_MANAGEMENT: "♻️", RECYCLING: "🔄", COMPOSTING: "🌱", "E-WASTE": "💻", TIPS: "💡",
};
const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-700",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700",
  ADVANCED: "bg-red-100 text-red-700",
};

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  viewsCount: number;
  difficulty?: string;
  createdAt: string;
}

export function EducationScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featured, setFeatured] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [all, feat] = await Promise.all([
        educationAPI.getAll(),
        educationAPI.getFeatured(),
      ]);
      setArticles(all);
      setFeatured(feat);
    } catch {
      setError("Failed to load educational content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Fix known-broken seeded URLs (runtime mapping for already-seeded DB entries)
  useEffect(() => {
    if (!articles || articles.length === 0) return;
    const fixed = articles.map(a => {
      if (a.thumbnailUrl && a.thumbnailUrl.includes('photo-1542601906897-ecd432fcfb7d')) {
        return { ...a, thumbnailUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800' };
      }
      return a;
    });
    // Only update if any change
    if (JSON.stringify(fixed) !== JSON.stringify(articles)) setArticles(fixed);
  }, [articles]);

  const handleExpand = async (article: Article) => {
    if (expandedId === article.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(article.id);
    // Increment view count
    try { await educationAPI.getById(article.id); } catch { /* ignore */ }
  };

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "ALL" || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const FeaturedCard = ({ article }: { article: Article }) => (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExpand(article)}>
      <div className="flex gap-4 p-4">
        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">Image unavailable</text></svg>'; }}
            />
          ) : article.videoUrl ? (
            <Video className="h-7 w-7 text-muted-foreground" />
          ) : (
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-1 flex-wrap">
            {article.videoUrl && <Badge variant="secondary" className="text-xs">Video</Badge>}
            {article.difficulty && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[article.difficulty] ?? ""}`}>
                {article.difficulty.charAt(0) + article.difficulty.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{article.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewsCount}</span>
            <span>{CATEGORY_LABELS[article.category] ?? article.category}</span>
          </div>
        </div>
        <div className="self-center text-muted-foreground">
          {expandedId === article.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      {expandedId === article.id && (
        <div className="px-4 pb-4 border-t border-border">
          {article.thumbnailUrl && (
            <div className="my-3 rounded-lg overflow-hidden aspect-video bg-muted">
              <img
                src={article.thumbnailUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="lazy"
                crossOrigin="anonymous"
                onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24">Image unavailable</text></svg>'; }}
              />
            </div>
          )}
          {article.videoUrl && (
            <div className="my-3">
              <a href={article.videoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full">
                  <Video className="mr-2 h-4 w-4" />Watch Video
                </Button>
              </a>
            </div>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mt-3">
            {article.content}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Learn & Educate" subtitle="Sustainable living guides" />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              className="whitespace-nowrap flex-shrink-0"
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content...</div>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
          </Card>
        ) : (
          <>
            {/* Featured */}
            {!search && activeCategory === "ALL" && featured.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Featured</h2>
                <div className="space-y-3">
                  {featured.map((a) => <FeaturedCard key={a.id} article={a} />)}
                </div>
              </div>
            )}

            {/* All / Filtered */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">
                  {search ? `Results for "${search}"` : activeCategory === "ALL" ? "All Articles" : CATEGORY_LABELS[activeCategory]}
                </h2>
                <span className="text-sm text-muted-foreground">{filtered.length} articles</span>
              </div>
              {filtered.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No articles found</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filtered.map((a) => <FeaturedCard key={a.id} article={a} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
