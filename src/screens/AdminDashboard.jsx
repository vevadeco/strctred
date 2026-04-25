"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Hammer, LogOut, Users, Eye, TrendingUp, Download, MoreVertical,
  Trash2, RefreshCw, Phone, Mail, Calendar, Megaphone, Save,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = "/api";

const AdminDashboard = () => {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promoSettings, setPromoSettings] = useState({
    enabled: true,
    title: "",
    subtitle: "",
    discount_text: "",
    cta_text: "",
    deadline_date: "",
  });
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, analyticsRes, promoRes] = await Promise.all([
        axios.get(`${API}/admin/leads`),
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/promo-banner`),
      ]);
      setLeads(leadsRes.data);
      setAnalytics(analyticsRes.data);
      setPromoSettings(promoRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        router.push("/admin/login");
      } else {
        toast.error("Failed to load data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    axios.post(`${API}/auth/logout`).catch(() => {}).finally(() => router.push("/admin/login"));
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axios.patch(`${API}/admin/leads/${leadId}/status?status=${newStatus}`, {}, {});
      setLeads(leads.map((lead) => lead.id === leadId ? { ...lead, status: newStatus } : lead));
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await axios.delete(`${API}/admin/leads/${leadId}`, {});
      setLeads(leads.filter((lead) => lead.id !== leadId));
      toast.success("Lead deleted");
    } catch (error) {
      toast.error("Failed to delete lead");
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/admin/leads/export`);
      const blob = new Blob([response.data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error("Failed to export leads");
    }
  };

  const handleSavePromo = async () => {
    setIsSavingPromo(true);
    try {
      await axios.put(`${API}/admin/promo-banner`, promoSettings);
      toast.success("Promo banner settings saved!");
    } catch (error) {
      toast.error("Failed to save promo settings");
    } finally {
      setIsSavingPromo(false);
    }
  };

  const getServiceLabel = (serviceType) => {
    const labels = {
      "deck-build": "Custom Deck",
      "pergola": "Pergola",
      "shed": "Shed / Outbuilding",
      "open-concept": "Open Concept",
    };
    return labels[serviceType] || serviceType;
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-purple-100 text-purple-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const statuses = ["new", "contacted", "qualified", "converted", "lost"];

  return (
    <div className="min-h-screen bg-muted/30" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Hammer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold">Strctred Living Spaces</h1>
                <p className="text-xs text-primary-foreground/70 font-body">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost" size="sm" onClick={fetchData}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
              <Button
                variant="ghost" size="sm" onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border">
              <TabsTrigger value="overview" className="font-body">
                <TrendingUp className="w-4 h-4 mr-2" />Overview
              </TabsTrigger>
              <TabsTrigger value="leads" className="font-body">
                <Users className="w-4 h-4 mr-2" />Leads
              </TabsTrigger>
              <TabsTrigger value="promo" className="font-body">
                <Megaphone className="w-4 h-4 mr-2" />Promo Banner
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="stat-total-leads">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Total Leads</p>
                        <p className="font-heading text-3xl text-foreground">{analytics?.total_leads || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">{analytics?.leads_today || 0} today</p>
                  </CardContent>
                </Card>

                <Card data-testid="stat-total-visitors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Page Views</p>
                        <p className="font-heading text-3xl text-foreground">{analytics?.total_page_views || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">{analytics?.visitors_today || 0} today</p>
                  </CardContent>
                </Card>

                <Card data-testid="stat-conversion-rate">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="font-heading text-3xl text-foreground">{analytics?.conversion_rate || 0}%</p>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">Visitors to leads</p>
                  </CardContent>
                </Card>

                <Card data-testid="stat-weekly">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">This Week</p>
                        <p className="font-heading text-3xl text-foreground">{analytics?.leads_this_week || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">{analytics?.visitors_this_week || 0} visitors</p>
                  </CardContent>
                </Card>
              </div>

              {analytics?.daily_stats && analytics.daily_stats.length > 0 && (
                <Card data-testid="daily-stats-chart">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Last 7 Days Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {analytics.daily_stats.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col items-center gap-1">
                            <div
                              className="w-full bg-primary/20 rounded-t"
                              style={{
                                height: `${Math.max(
                                  (day.visitors / Math.max(...analytics.daily_stats.map((d) => d.visitors), 1)) * 100, 4
                                )}px`,
                              }}
                            >
                              <div
                                className="w-full bg-primary rounded-t transition-all"
                                style={{ height: `${day.visitors > 0 ? (day.leads / day.visitors) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-body">
                            {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="text-xs font-body font-medium">{day.leads}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary/20 rounded" />
                        <span className="text-xs font-body text-muted-foreground">Page Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded" />
                        <span className="text-xs font-body text-muted-foreground">Leads</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads">
              <Card data-testid="leads-table-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg">All Leads ({leads.length})</CardTitle>
                  <Button onClick={handleExport} variant="outline" size="sm" className="font-body" data-testid="export-btn">
                    <Download className="w-4 h-4 mr-2" />Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-body text-muted-foreground">No leads yet. They'll appear here when someone submits the form.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-body font-semibold">Name</TableHead>
                            <TableHead className="font-body font-semibold">Contact</TableHead>
                            <TableHead className="font-body font-semibold">Structure</TableHead>
                            <TableHead className="font-body font-semibold">Status</TableHead>
                            <TableHead className="font-body font-semibold">Date</TableHead>
                            <TableHead className="font-body font-semibold w-[50px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.map((lead) => (
                            <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
                              <TableCell className="font-body font-medium">{lead.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-primary">
                                    <Mail className="w-3 h-3" />{lead.email}
                                  </a>
                                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-primary">
                                    <Phone className="w-3 h-3" />{lead.phone}
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell className="font-body">{getServiceLabel(lead.service_type)}</TableCell>
                              <TableCell>
                                <Select value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
                                  <SelectTrigger className={`w-[130px] h-8 text-xs font-body ${getStatusColor(lead.status)}`} data-testid={`status-select-${lead.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statuses.map((status) => (
                                      <SelectItem key={status} value={status} className="font-body text-xs capitalize">{status}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="font-body text-sm text-muted-foreground">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`lead-actions-${lead.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-destructive font-body">
                                      <Trash2 className="w-4 h-4 mr-2" />Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promo Banner Tab */}
            <TabsContent value="promo">
              <Card data-testid="promo-settings-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />Promotional Banner Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-body font-semibold text-foreground">Enable Promo Banner</Label>
                      <p className="text-sm text-muted-foreground font-body">Show the promotional banner on the website</p>
                    </div>
                    <Switch
                      checked={promoSettings.enabled}
                      onCheckedChange={(checked) => setPromoSettings({ ...promoSettings, enabled: checked })}
                      data-testid="promo-enabled-switch"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="promo-title" className="font-body font-medium">Title</Label>
                      <Input
                        id="promo-title" value={promoSettings.title}
                        onChange={(e) => setPromoSettings({ ...promoSettings, title: e.target.value })}
                        placeholder="Summer Build Special — 10% OFF!" className="font-body" data-testid="promo-title-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-subtitle" className="font-body font-medium">Subtitle</Label>
                      <Input
                        id="promo-subtitle" value={promoSettings.subtitle}
                        onChange={(e) => setPromoSettings({ ...promoSettings, subtitle: e.target.value })}
                        placeholder="Book your project before the season fills up" className="font-body" data-testid="promo-subtitle-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-cta" className="font-body font-medium">Button Text</Label>
                      <Input
                        id="promo-cta" value={promoSettings.cta_text}
                        onChange={(e) => setPromoSettings({ ...promoSettings, cta_text: e.target.value })}
                        placeholder="Claim Offer" className="font-body" data-testid="promo-cta-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-deadline" className="font-body font-medium">Countdown Deadline</Label>
                      <Input
                        id="promo-deadline" type="date" value={promoSettings.deadline_date}
                        onChange={(e) => setPromoSettings({ ...promoSettings, deadline_date: e.target.value })}
                        className="font-body" data-testid="promo-deadline-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-body font-medium">Preview</Label>
                    <div className="bg-accent text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{promoSettings.title || "Your promo title..."}</p>
                          <p className="text-xs text-white/80">{promoSettings.subtitle || "Your promo subtitle..."}</p>
                        </div>
                        <span className="bg-white text-accent px-3 py-1 rounded-full text-xs font-semibold">
                          {promoSettings.cta_text || "CTA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSavePromo} disabled={isSavingPromo} className="bg-primary hover:bg-primary/90 font-body" data-testid="save-promo-btn">
                      <Save className="w-4 h-4 mr-2" />{isSavingPromo ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
