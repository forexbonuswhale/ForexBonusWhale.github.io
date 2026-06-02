import { useState } from "react";
import { useLocation } from "wouter";
import { useData } from "../context/DataContext";
import { BrokerCard, BrokerCardSkeleton } from "../components/BrokerCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const categoryOptions = [
  { label: "No Deposit Bonus", href: "/no-deposit" },
  { label: "Deposit Bonus", href: "/deposit" },
  { label: "Contests", href: "/contests" },
];

export default function BrokerList({
  category,
  title,
  description,
}: {
  category: "no_deposit" | "deposit" | "contest";
  title: string;
  description: string;
}) {
  const { getBrokersByCategory, isLoading } = useData();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<string>("popular");

  const brokers = getBrokersByCategory(category);

  let filtered = [...brokers];
  if (filter !== "all") {
    filtered = filtered.filter(b => b.status === filter);
  }

  filtered.sort((a, b) => {
    if (sort === "popular") return (b.views ?? 0) - (a.views ?? 0);
    if (sort === "rated") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (sort === "oldest") return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    return 0;
  });

  return (
    <div>
      <div className="mb-10 text-center md:text-left py-8 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 border-l-4 border-primary pl-4">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">{description}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 text-base font-semibold text-foreground border-l-4 border-primary pl-3 hover:text-primary transition-colors group">
              {title}
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {categoryOptions.map(opt => (
              <DropdownMenuItem key={opt.href} onClick={() => navigate(opt.href)} className="cursor-pointer">
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as "all" | "active" | "inactive")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rated">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <BrokerCardSkeleton key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((broker) => <BrokerCard key={broker.id} broker={broker} />)
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No brokers found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
