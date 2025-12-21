import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function AnalyticsScreen() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm opacity-90 mt-1">Track your waste reduction progress</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button size="sm" variant="default">Week</Button>
          <Button size="sm" variant="outline">Month</Button>
          <Button size="sm" variant="outline">Year</Button>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Waste Trends</h3>
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Line Chart Placeholder</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Reduction</span>
            </div>
            <p className="text-2xl font-bold">24%</p>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">days logging</p>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">By Category</h3>
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Pie Chart Placeholder</p>
          </div>
        </Card>

        <Card className="bg-accent/10 border-accent/20 p-4">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <p className="text-sm text-muted-foreground">
            Your e-waste has decreased by 30% this month! Keep up the great work.
            Consider donating old electronics instead of discarding them.
          </p>
        </Card>
      </div>
    </div>
  );
}
