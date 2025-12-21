import { BookOpen, Video, Bookmark } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function EducationScreen() {
  const featured = [
    { title: "Complete Guide to E-waste Recycling", type: "Article", duration: "5 min read" },
    { title: "Zero Waste Living Tips", type: "Video", duration: "12 min" },
    { title: "Composting 101", type: "Article", duration: "8 min read" },
  ];

  const categories = ["E-waste", "Food Waste", "Composting", "Recycling", "Sustainability"];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Education & Tips</h1>
        <p className="text-sm opacity-90 mt-1">Learn about sustainable practices</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Featured Content</h2>
          <div className="space-y-3">
            {featured.map((item, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.type === "Video" ? (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">{item.type}</Badge>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.duration}</p>
                  </div>
                  <button className="self-start text-muted-foreground hover:text-foreground">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Browse by Topic</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, idx) => (
              <Card key={idx} className="p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="text-3xl mb-2">📚</div>
                <p className="font-medium text-sm">{category}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 p-6">
          <h3 className="font-bold mb-2">Your Progress</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You've completed 8 out of 20 educational modules
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/5"></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
