import { useData } from "../context/DataContext";
import { TrendingUp, Zap, MessageSquare } from "lucide-react";

export function StatsBar() {
  const { stats, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 mb-8 py-3 px-4 bg-card border border-border rounded-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-8 bg-muted rounded animate-pulse" />
            </div>
            {i < 3 && <div className="w-px h-8 bg-border mx-2" />}
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { icon: <TrendingUp className="h-4 w-4 text-primary" />, bg: "bg-primary/10", label: "Total Brokers", value: stats.totalBrokers },
    { icon: <Zap className="h-4 w-4 text-green-500" />, bg: "bg-green-500/10", label: "Active Bonuses", value: stats.activeBonuses },
    { icon: <MessageSquare className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10", label: "Total Reviews", value: stats.totalReviews },
  ];

  return (
    <div className="flex items-center mb-8 py-3 px-4 bg-card border border-border rounded-lg w-full">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1.5 ${item.bg} rounded-full shrink-0`}>{item.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-tight truncate">{item.label}</p>
            <p className="text-sm font-bold text-foreground leading-tight">{item.value}</p>
          </div>
          {i < items.length - 1 && <div className="w-px h-8 bg-border ml-auto shrink-0" />}
        </div>
      ))}
    </div>
  );
}
