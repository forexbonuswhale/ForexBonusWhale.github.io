import { useState, useEffect } from "react";
import { useData, FB_URL } from "../context/DataContext";
import { Broker } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Verification {
  id: string;
  name: string;
  email: string;
  brokerName: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const { allBrokers, isLoading, refreshBrokers } = useData();
  const { toast } = useToast();

  const [editingBroker, setEditingBroker] = useState<Partial<Broker> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [updatingVerif, setUpdatingVerif] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "gg89898989") {
      setIsAuthenticated(true);
    } else {
      toast({ title: "Access Denied", description: "Incorrect PIN", variant: "destructive" });
    }
  };

  const fetchVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const res = await fetch(`${FB_URL}/verifications.json`);
      const data = await res.json();
      if (!data) { setVerifications([]); return; }
      const list: Verification[] = Object.entries(data as Record<string, unknown>).map(([key, val]) => ({
        id: key,
        ...(val as Omit<Verification, "id">),
      }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVerifications(list);
    } catch {
      toast({ title: "Error", description: "Failed to load verifications", variant: "destructive" });
    } finally {
      setVerificationsLoading(false);
    }
  };

  const handleVerifStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingVerif(id);
    try {
      await fetch(`${FB_URL}/verifications/${id}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v));
      toast({ title: "Updated", description: `Verification ${status}.` });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingVerif(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this broker permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${FB_URL}/brokers/${id}.json`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: "Broker removed from Firebase." });
      refreshBrokers();
    } catch {
      toast({ title: "Error", description: "Failed to delete broker", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const toFirebase = (b: Partial<Broker>) => ({
    name: b.name ?? "",
    category: b.category ?? "no_deposit",
    bonusAmount: String(b.bonus ?? 0),
    status: b.status ?? "active",
    link: b.website ?? "",
    rules: b.terms ?? "",
    description: b.description ?? "",
    howToClaimSteps: b.howToClaimSteps ?? [],
    country: b.country ?? "",
    regulated: b.regulated ?? false,
    ratingAvg: b.rating ?? 0,
    ratingCount: b.reviews ?? 0,
    viewCount: b.views ?? 0,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBroker) return;
    setSaving(true);
    try {
      if (isAdding) {
        const res = await fetch(`${FB_URL}/brokers.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...toFirebase(editingBroker), viewCount: 0, createdAt: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Added", description: "New broker saved to Firebase." });
      } else {
        const { id } = editingBroker as Broker;
        const res = await fetch(`${FB_URL}/brokers/${id}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toFirebase(editingBroker)),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Updated", description: "Broker updated in Firebase." });
      }
      setEditingBroker(null);
      refreshBrokers();
    } catch {
      toast({ title: "Error", description: "Failed to save broker", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md bg-card">
          <CardHeader><CardTitle>Admin Access</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editingBroker) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{isAdding ? "Add New Broker" : "Edit Broker"}</h2>
          <Button variant="ghost" onClick={() => setEditingBroker(null)}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
        <Card className="bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <Input required value={editingBroker.name || ""} onChange={e => setEditingBroker({ ...editingBroker, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category *</label>
                  <Select value={editingBroker.category} onValueChange={(v: Broker["category"]) => setEditingBroker({ ...editingBroker, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_deposit">No Deposit</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="contest">Contest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Bonus Amount *</label>
                  <Input type="number" required value={editingBroker.bonus ?? ""} onChange={e => setEditingBroker({ ...editingBroker, bonus: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status *</label>
                  <Select value={editingBroker.status} onValueChange={(v: Broker["status"]) => setEditingBroker({ ...editingBroker, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Website / Link</label>
                  <Input value={editingBroker.website || ""} onChange={e => setEditingBroker({ ...editingBroker, website: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Country</label>
                  <Input value={editingBroker.country || ""} onChange={e => setEditingBroker({ ...editingBroker, country: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Regulated</label>
                  <Select value={editingBroker.regulated ? "yes" : "no"} onValueChange={v => setEditingBroker({ ...editingBroker, regulated: v === "yes" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground" value={editingBroker.description || ""} onChange={e => setEditingBroker({ ...editingBroker, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Terms / Rules</label>
                <textarea className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground" value={editingBroker.terms || ""} onChange={e => setEditingBroker({ ...editingBroker, terms: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">How to Claim Steps (one per line)</label>
                <textarea className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground" value={editingBroker.howToClaimSteps?.join("\n") || ""} onChange={e => setEditingBroker({ ...editingBroker, howToClaimSteps: e.target.value.split("\n").filter(Boolean) })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Broker"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="brokers">
        <TabsList className="mb-6">
          <TabsTrigger value="brokers">Brokers</TabsTrigger>
          <TabsTrigger value="verifications" onClick={fetchVerifications}>Verification Requests</TabsTrigger>
        </TabsList>

        {/* ── BROKERS TAB ── */}
        <TabsContent value="brokers">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">{allBrokers.length} broker(s) in Firebase</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshBrokers}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={() => { setIsAdding(true); setEditingBroker({ category: "no_deposit", status: "active", regulated: false, howToClaimSteps: [] }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Broker
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
          ) : allBrokers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No brokers found in Firebase.</div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Bonus</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allBrokers.map(broker => (
                      <tr key={broker.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{broker.name}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{broker.category.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-primary font-semibold">${broker.bonus}</td>
                        <td className="px-4 py-3 text-muted-foreground">{(broker.rating ?? 0).toFixed(1)} ({broker.reviews ?? 0})</td>
                        <td className="px-4 py-3 text-muted-foreground">{broker.views ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${broker.status === "active" ? "bg-green-500/10 text-green-500" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                            {broker.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditingBroker(broker); setIsAdding(false); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleting === broker.id} onClick={() => handleDelete(broker.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── VERIFICATIONS TAB ── */}
        <TabsContent value="verifications">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">{verifications.length} verification request(s)</span>
            <Button variant="outline" size="sm" onClick={fetchVerifications} disabled={verificationsLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${verificationsLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {verificationsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}</div>
          ) : verifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No verification requests yet.</p>
              <p className="text-xs mt-1">Requests submitted via the website appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifications.map(v => (
                <Card key={v.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-foreground">{v.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{v.email || "no email"}</span>
                          <Badge className={
                            v.status === "approved" ? "bg-green-500/10 text-green-500" :
                            v.status === "rejected" ? "bg-red-500/10 text-red-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }>
                            {v.status === "approved" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : v.status === "rejected" ? <XCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                            {v.status}
                          </Badge>
                        </div>
                        {v.brokerName && <p className="text-sm text-muted-foreground">Broker: <span className="text-foreground">{v.brokerName}</span></p>}
                        {v.message && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{v.message}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"}</p>
                      </div>
                      {v.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={updatingVerif === v.id} onClick={() => handleVerifStatus(v.id, "approved")}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" disabled={updatingVerif === v.id} onClick={() => handleVerifStatus(v.id, "rejected")}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
