import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Broker, BrokerReview } from "../types";
import { mapFirebaseBroker, FB_URL } from "../context/DataContext";
import {
  ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck,
  Star, Eye, ExternalLink, MapPin, Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function BrokerDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [broker, setBroker] = useState<Broker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reviews, setReviews] = useState<BrokerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [userName, setUserName] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchBroker() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`${FB_URL}/brokers/${id}.json`);
        if (!res.ok) throw new Error("Failed to fetch");
        const raw = await res.json();
        if (cancelled) return;
        if (!raw || typeof raw !== "object") {
          setNotFound(true);
        } else {
          setBroker(mapFirebaseBroker(raw as Record<string, unknown>, id));
          const newViews = ((raw as Record<string, unknown>).viewCount as number ?? 0) + 1;
          fetch(`${FB_URL}/brokers/${id}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ viewCount: newViews }),
          }).catch(() => {});
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    async function fetchReviews() {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${FB_URL}/reviews/${id}.json`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (!data) { setReviews([]); return; }
        const list: BrokerReview[] = Object.entries(data as Record<string, unknown>).map(([key, val]) => ({
          id: key,
          ...(val as Omit<BrokerReview, "id">),
        }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    fetchBroker();
    fetchReviews();
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !userName.trim() || userRating === 0 || !comment.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields and select a rating.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const newReview = { userName: userName.trim(), rating: userRating, comment: comment.trim(), createdAt: new Date().toISOString() };
      const postRes = await fetch(`${FB_URL}/reviews/${id}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
      });
      if (!postRes.ok) throw new Error("Failed to post review");

      const allRes = await fetch(`${FB_URL}/reviews/${id}.json`);
      const allData = await allRes.json();
      if (allData && typeof allData === "object") {
        const allReviews = Object.values(allData as Record<string, { rating: number }>);
        const count = allReviews.length;
        const avg = allReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / count;
        await fetch(`${FB_URL}/brokers/${id}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ratingAvg: parseFloat(avg.toFixed(2)), ratingCount: count }),
        });
        setBroker(prev => prev ? { ...prev, rating: parseFloat(avg.toFixed(2)), reviews: count } : prev);

        const updatedList: BrokerReview[] = Object.entries(allData as Record<string, unknown>).map(([key, val]) => ({
          id: key,
          ...(val as Omit<BrokerReview, "id">),
        }));
        updatedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(updatedList);
      }

      setUserName("");
      setUserRating(0);
      setComment("");
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    } catch {
      toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-muted rounded animate-pulse mb-8" />
        <div className="h-32 w-full bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="h-64 w-full bg-card rounded-lg animate-pulse" />
            <div className="h-64 w-full bg-card rounded-lg animate-pulse" />
          </div>
          <div className="h-48 w-full bg-card rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !broker) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Broker Not Found</h2>
        <p className="text-muted-foreground mb-8">The broker you are looking for does not exist or has been removed.</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const formatBonus = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: broker.bonusCurrency || "USD", maximumFractionDigits: 0 }).format(amount);

  const renderStars = (rating: number, size = "h-5 w-5") =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < Math.floor(rating) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
    ));

  const websiteHref = broker.website
    ? broker.website.startsWith("http") ? broker.website : `https://${broker.website}`
    : "#";

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <Link href="/">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-medium cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
        </span>
      </Link>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{broker.name}</h1>
            <Badge
              variant={broker.status === "active" ? "default" : "secondary"}
              className={broker.status === "active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${broker.status === "active" ? "bg-green-500" : "bg-muted-foreground"}`} />
              {broker.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(broker.rating)}</div>
              <span className="font-medium text-foreground ml-1">{(broker.rating ?? 0).toFixed(1)}</span>
              <span>({broker.reviews ?? 0} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{(broker.views ?? 0).toLocaleString()} views</span>
            </div>
            {broker.regulated ? (
              <div className="flex items-center gap-1 text-green-500">
                <ShieldCheck className="h-4 w-4" /><span>Regulated</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-500">
                <ShieldAlert className="h-4 w-4" /><span>Unregulated</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-left md:text-right bg-background p-4 rounded-lg border border-border min-w-[200px]">
          <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Bonus Amount</div>
          <div className="text-4xl font-bold text-primary mb-4">{formatBonus(broker.bonus)}</div>
          <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="block w-full">
            <Button className="w-full font-bold">
              Claim Bonus <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {broker.description && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-xl">About {broker.name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{broker.description}</p>
              </CardContent>
            </Card>
          )}

          {broker.howToClaimSteps && broker.howToClaimSteps.length > 0 && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-xl">How to Claim</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-4 relative border-l border-border ml-3 pl-6">
                  {broker.howToClaimSteps.map((step, index) => (
                    <li key={index} className="relative">
                      <span className="absolute -left-[35px] bg-primary text-primary-foreground font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm ring-4 ring-card">
                        {index + 1}
                      </span>
                      <p className="text-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {broker.terms && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-xl">Terms &amp; Conditions</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground leading-relaxed p-4 bg-background rounded-md border border-border whitespace-pre-wrap">
                  {broker.terms}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-xl">User Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmitReview} className="space-y-4 p-4 bg-background rounded-lg border border-border">
                <div className="text-sm font-semibold text-foreground">Write a Review</div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Star Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (hoverRating || userRating)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                    {(hoverRating || userRating) > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground self-center">
                        {(hoverRating || userRating)} / 5
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Comment</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    placeholder="Share your experience with this broker..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Review</>}
                </Button>
              </form>

              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="p-4 bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-foreground">{rev.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex mb-2">{renderStars(rev.rating, "h-4 w-4")}</div>
                      <p className="text-sm text-muted-foreground">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-lg">Broker Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {broker.country && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Country</div>
                      <div className="text-sm font-medium">{broker.country}</div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-sm font-medium capitalize">{broker.category.replace("_", " ")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
