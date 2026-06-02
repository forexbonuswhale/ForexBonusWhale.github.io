import React, { createContext, useContext, useEffect, useState } from "react";
import { Broker, Stats } from "../types";

const FB_URL = "https://froexbonuswhale-default-rtdb.firebaseio.com";

function mapFirebaseBroker(raw: Record<string, unknown>, routingId: string): Broker {
  return {
    id: routingId,
    name: (raw.name as string) || "",
    category: (raw.category as Broker["category"]) || "no_deposit",
    bonus: parseFloat((raw.bonusAmount as string) ?? "0") || 0,
    bonusCurrency: (raw.bonusCurrency as string) || "USD",
    status: (raw.status as Broker["status"]) || "inactive",
    views: (raw.viewCount as number) ?? 0,
    rating: (raw.ratingAvg as number) ?? 0,
    reviews: (raw.ratingCount as number) ?? 0,
    description: (raw.description as string) || "",
    howToClaimSteps: (raw.howToClaimSteps as string[]) || [],
    terms: (raw.rules as string) || "",
    website: (raw.link as string) || "",
    regulated: (raw.regulated as boolean) || false,
    country: (raw.country as string) || "",
    logo: raw.logo as string | undefined,
    createdAt: (raw.createdAt as string) || undefined,
  };
}

interface DataContextType {
  allBrokers: Broker[];
  stats: Stats;
  isLoading: boolean;
  error: Error | null;
  getBrokersByCategory: (category: Broker["category"]) => Broker[];
  refreshBrokers: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchBrokers() {
      setIsLoading(true);
      try {
        const response = await fetch(`${FB_URL}/brokers.json`);
        if (!response.ok) throw new Error("Failed to fetch brokers");
        const data = await response.json();

        if (!cancelled) {
          if (!data) {
            setAllBrokers([]);
          } else if (Array.isArray(data)) {
            setAllBrokers(
              data
                .map((broker, index) => mapFirebaseBroker(broker as Record<string, unknown>, String(index)))
                .filter(b => b.name)
            );
          } else {
            const entries = Object.entries(data as Record<string, unknown>);
            setAllBrokers(
              entries
                .map(([key, broker]) => mapFirebaseBroker(broker as Record<string, unknown>, key))
                .filter(b => b.name)
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchBrokers();
    return () => { cancelled = true; };
  }, [tick]);

  const stats: Stats = {
    totalBrokers: allBrokers.length,
    activeBonuses: allBrokers.filter(b => b.status === "active").length,
    totalReviews: allBrokers.reduce((sum, b) => sum + (b.reviews || 0), 0),
  };

  const getBrokersByCategory = (category: Broker["category"]) =>
    allBrokers.filter(b => b.category === category);

  const refreshBrokers = () => setTick(t => t + 1);

  return (
    <DataContext.Provider value={{ allBrokers, stats, isLoading, error, getBrokersByCategory, refreshBrokers }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

export { mapFirebaseBroker, FB_URL };
