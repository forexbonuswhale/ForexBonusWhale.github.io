import { Link } from "wouter";
import { Eye, Star, ChevronRight } from "lucide-react";
import { Broker } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrokerCardProps {
  broker: Broker;
}

export function BrokerCard({ broker }: BrokerCardProps) {
  const formatBonus = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating: number | undefined) => {
    const safeRating = rating ?? 0;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.floor(safeRating) ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      );
    }
    return stars;
  };

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors bg-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-card-foreground line-clamp-1">{broker.name}</h3>
          <Badge 
            variant={broker.status === "active" ? "default" : "secondary"}
            className={broker.status === "active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${broker.status === "active" ? "bg-green-500" : "bg-muted-foreground"}`}></span>
            {broker.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-1">Bonus</div>
          <div className="text-3xl font-bold text-primary">
            {formatBonus(broker.bonus, broker.bonusCurrency)}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex">
              {renderStars(broker.rating)}
            </div>
            <span className="text-sm font-medium text-foreground">{(broker.rating ?? 0).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({broker.reviews ?? 0})</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Eye className="h-4 w-4 mr-1" />
            {(broker.views ?? 0).toLocaleString()}
          </div>
        </div>

        <Link href={`/broker/${broker.id}`} className="block w-full">
          <div className="w-full flex items-center justify-center py-2.5 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors font-medium">
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export function BrokerCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div>
        </div>
        <div className="mb-6">
          <div className="h-4 w-12 bg-muted rounded mb-2 animate-pulse"></div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}
