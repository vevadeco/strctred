"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Hammer, LogOut, Users, Eye, TrendingUp, Download, MoreVertical,
  Trash2, RefreshCw, Phone, Mail, Calendar, Megaphone, Save,
  FileText, Plus, DollarSign, StickyNote, ArrowRightLeft,
  XCircle, Settings, Link, CheckCircle2, Copy, ExternalLink,
  CreditCard, AlertTriangle, ChevronRight, Send,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = "/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getServiceLabel = (serviceType) => {
  const labels = {
    "deck-build": "Custom Deck",
    "pergola": "Pergola",
    "shed": "Shed / Outbuilding",
    "open-concept": "Open Concept",
  };
  return labels[serviceType] || serviceType || "—";
};

const getStatusColor = (status) => ({
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
}[status] || "bg-gray-100 text-gray-800");

const getPriorityColor = (priority) => ({
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}[priority] || "bg-gray-100 text-gray-800");

const getInvoiceStatusColor = (status) => ({
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-orange-100 text-orange-700",
  cancelled: "bg-slate-100 text-slate-700",
}[status] || "bg-gray-100 text-gray-800");

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "won", "lost", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const INVOICE_STATUSES = ["draft", "sent", "accepted", "declined", "paid", "overdue", "cancelled"];

const BLANK_INVOICE_FORM = {
  lead_id: "", client_name: "", client_email: "", client_phone: "",
  client_address: "", due_date: "", tax_rate: 0, notes: "",
  items: [{ description: "", quantity: 1, unit_price: 0 }],
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const router = useRouter();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [leads, setLeads] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Promo ────────────────────────────────────────────────────────────────────
  const [promoSettings, setPromoSettings] = useState({
    enabled: true, title: "", subtitle: "", discount_text: "", cta_text: "", deadline_date: "",
  });
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  // ── App Settings / Stripe ────────────────────────────────────────────────────
  const [appSettings, setAppSettings] = useState({
    stripe_publishable_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    stripe_enabled: "false",
    resend_api_key: "",
    resend_enabled: "false",
    resend_from_email: "",
    resend_from_name: "",
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ── Lead management ──────────────────────────────────────────────────────────
  const [leadFilter, setLeadFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  // ── Invoice/Estimate form ────────────────────────────────────────────────────
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceType, setInvoiceType] = useState("estimate");
  const [invoiceForm, setInvoiceForm] = useState(BLANK_INVOICE_FORM);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  // ── Invoice detail ────────────────────────────────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendEmailTo, setSendEmailTo] = useState("");

  // ─────────────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsRes, analyticsRes, promoRes, invoicesRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/leads`),
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/promo-banner`),
        axios.get(`${API}/admin/invoices`),
        axios.get(`${API}/admin/settings`),
      ]);
      setLeads(leadsRes.data);
      setAnalytics(analyticsRes.data);
      setPromoSettings(promoRes.data);
      setInvoices(invoicesRes.data);
      setAppSettings((prev) => ({ ...prev, ...settingsRes.data }));
    } catch (error) {
      if (error.response?.status === 401) {
        router.push("/admin/login");
      } else {
        toast.error("Failed to load data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    axios.post(`${API}/auth/logout`).catch(() => {}).finally(() => router.push("/admin/login"));
  };

  // ── Lead handlers ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axios.patch(`${API}/admin/leads/${leadId}/status?status=${newStatus}`);
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handlePriorityChange = async (leadId, newPriority) => {
    try {
      await axios.patch(`${API}/admin/leads/${leadId}`, { priority: newPriority });
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, priority: newPriority } : l));
      toast.success("Priority updated");
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const handleSaveNotes = async (leadId) => {
    try {
      await axios.patch(`${API}/admin/leads/${leadId}`, { notes: leadNotes });
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, notes: leadNotes } : l));
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/admin/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success("Lead deleted");
    } catch {
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
    } catch {
      toast.error("Failed to export leads");
    }
  };

  /** Convert a lead to an estimate by opening the form pre-filled with lead details */
  const handleConvertLeadToEstimate = (lead) => {
    setInvoiceForm({
      lead_id: lead.id,
      client_name: lead.name || "",
      client_email: lead.email || "",
      client_phone: lead.phone || "",
      client_address: "",
      due_date: "",
      tax_rate: 0,
      notes: "",
      items: [{ description: getServiceLabel(lead.service_type), quantity: 1, unit_price: 0 }],
    });
    setInvoiceType("estimate");
    setShowLeadDetail(false);
    setShowInvoiceForm(true);
  };

  const openLeadDetail = (lead) => {
    setSelectedLead(lead);
    setLeadNotes(lead.notes || "");
    setShowLeadDetail(true);
  };

  const openInvoiceFormForLead = (lead, type = "estimate") => {
    setInvoiceForm({
      lead_id: lead.id,
      client_name: lead.name || "",
      client_email: lead.email || "",
      client_phone: lead.phone || "",
      client_address: "",
      due_date: "",
      tax_rate: 0,
      notes: "",
      items: [{ description: getServiceLabel(lead.service_type), quantity: 1, unit_price: 0 }],
    });
    setInvoiceType(type);
    setShowInvoiceForm(true);
  };

  // ── Invoice handlers ──────────────────────────────────────────────────────────

  const handleCreateInvoice = async () => {
    if (!invoiceForm.client_name.trim()) { toast.error("Client name is required"); return; }
    if (invoiceForm.items.some((item) => !item.description.trim())) { toast.error("All items need a description"); return; }
    setIsSavingInvoice(true);
    try {
      const payload = {
        ...invoiceForm,
        type: invoiceType,
        lead_id: invoiceForm.lead_id || null,
        items: invoiceForm.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        })),
        tax_rate: Number(invoiceForm.tax_rate) || 0,
      };
      const res = await axios.post(`${API}/admin/invoices`, payload);
      toast.success(`${invoiceType === "invoice" ? "Invoice" : "Estimate"} ${res.data.invoice_number} created`);
      setShowInvoiceForm(false);
      setInvoiceForm(BLANK_INVOICE_FORM);
      await fetchData();
    } catch {
      toast.error("Failed to create " + invoiceType);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleInvoiceStatusChange = async (invoiceId, newStatus) => {
    try {
      await axios.patch(`${API}/admin/invoices/${invoiceId}/status?status=${newStatus}`);
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice((prev) => ({ ...prev, status: newStatus }));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConvertEstimateToInvoice = async (invoiceId) => {
    try {
      const res = await axios.post(`${API}/admin/invoices/${invoiceId}/convert`);
      toast.success(`Converted to invoice ${res.data.invoice_number}`);
      await fetchData();
      setShowInvoiceDetail(false);
    } catch {
      toast.error("Failed to convert estimate");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Delete this? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/admin/invoices/${invoiceId}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      if (showInvoiceDetail && selectedInvoice?.id === invoiceId) setShowInvoiceDetail(false);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openInvoiceDetail = async (inv) => {
    try {
      const res = await axios.get(`${API}/admin/invoices/${inv.id}`);
      setSelectedInvoice(res.data);
      setShowInvoiceDetail(true);
    } catch {
      toast.error("Failed to load invoice details");
    }
  };

  const handleCreatePaymentLink = async (invoiceId) => {
    setIsCreatingPaymentLink(true);
    try {
      const res = await axios.post(`${API}/admin/invoices/${invoiceId}/payment-link`);
      setSelectedInvoice((prev) => ({ ...prev, stripe_payment_link: res.data.payment_link }));
      setInvoices((prev) => prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, stripe_payment_link: res.data.payment_link } : inv
      ));
      toast.success(res.data.already_existed ? "Payment link retrieved" : "Payment link created");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create payment link";
      toast.error(msg);
    } finally {
      setIsCreatingPaymentLink(false);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard"));
  };

  const handleSendEmail = async (invoiceId, overrideTo) => {
    setIsSendingEmail(true);
    try {
      const payload = overrideTo ? { to: overrideTo } : {};
      await axios.post(`${API}/admin/invoices/${invoiceId}/send`, payload);
      const sentTo = overrideTo || selectedInvoice?.client_email;
      toast.success(`Email sent to ${sentTo}`);
      setInvoices((prev) => prev.map((inv) =>
        inv.id === invoiceId && inv.status === "draft" ? { ...inv, status: "sent" } : inv
      ));
      if (selectedInvoice?.id === invoiceId && selectedInvoice?.status === "draft") {
        setSelectedInvoice((prev) => ({ ...prev, status: "sent" }));
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send email";
      toast.error(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };
  // ── Invoice form helpers ──────────────────────────────────────────────────────

  const addInvoiceItem = () => setInvoiceForm((prev) => ({
    ...prev, items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }],
  }));

  const removeInvoiceItem = (index) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  // ── Promo handlers ─────────────────────────────────────────────────────────────

  const handleSavePromo = async () => {
    setIsSavingPromo(true);
    try {
      await axios.put(`${API}/admin/promo-banner`, promoSettings);
      toast.success("Promo settings saved");
    } catch {
      toast.error("Failed to save promo settings");
    } finally {
      setIsSavingPromo(false);
    }
  };

  // ── App settings handlers ──────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await axios.put(`${API}/admin/settings`, appSettings);
      toast.success("Settings saved");
      // Re-fetch to get masked values back
      const res = await axios.get(`${API}/admin/settings`);
      setAppSettings((prev) => ({ ...prev, ...res.data }));
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────────

  const filteredLeads = leads.filter((lead) => {
    if (leadFilter !== "all" && lead.status !== leadFilter) return false;
    if (priorityFilter !== "all" && lead.priority !== priorityFilter) return false;
    return true;
  });

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === "all") return true;
    if (invoiceFilter === "invoice" || invoiceFilter === "estimate") return inv.type === invoiceFilter;
    return inv.status === invoiceFilter;
  });

  const invoiceSubtotal = invoiceForm.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0
  );
  const invoiceTax = invoiceSubtotal * ((Number(invoiceForm.tax_rate) || 0) / 100);
  const invoiceTotal = invoiceSubtotal + invoiceTax;

  const stripeConfigured = appSettings.stripe_enabled === "true" && appSettings.stripe_secret_key;
  const resendConfigured = appSettings.resend_enabled === "true" && appSettings.resend_api_key;

  // ── Lead's associated invoices helper ─────────────────────────────────────────
  const getLeadInvoices = (leadId) => invoices.filter((inv) => inv.lead_id === leadId);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg px-2 py-1">
                <img src="/logo.png" alt="Strctred Outdoor Living Spaces" className="h-8 w-auto" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchData} className="text-primary-foreground hover:bg-primary-foreground/10">
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border flex-wrap h-auto">
              <TabsTrigger value="overview" className="font-body"><TrendingUp className="w-4 h-4 mr-2" />Overview</TabsTrigger>
              <TabsTrigger value="leads" className="font-body"><Users className="w-4 h-4 mr-2" />Leads</TabsTrigger>
              <TabsTrigger value="invoices" className="font-body"><FileText className="w-4 h-4 mr-2" />Invoices & Estimates</TabsTrigger>
              <TabsTrigger value="promo" className="font-body"><Megaphone className="w-4 h-4 mr-2" />Promo Banner</TabsTrigger>
              <TabsTrigger value="settings" className="font-body"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ───────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Total Leads</p>
                        <p className="font-heading text-3xl">{analytics?.total_leads || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">{analytics?.leads_today || 0} today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Page Views</p>
                        <p className="font-heading text-3xl">{analytics?.total_page_views || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">{analytics?.visitors_today || 0} today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="font-heading text-3xl">{analytics?.conversion_rate || 0}%</p>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">Visitors to leads</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-muted-foreground">Invoices</p>
                        <p className="font-heading text-3xl">{invoices.filter((i) => i.type === "invoice").length}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      {invoices.filter((i) => i.type === "estimate").length} estimates
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Pipeline */}
              <Card>
                <CardHeader><CardTitle className="font-heading text-lg">Lead Pipeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {LEAD_STATUSES.map((status) => (
                      <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="font-heading text-2xl">{leads.filter((l) => l.status === status).length}</p>
                        <p className="font-body text-xs text-muted-foreground capitalize">{status}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Chart */}
              {analytics?.daily_stats?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="font-heading text-lg">Last 7 Days Activity</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {analytics.daily_stats.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary/20 rounded-t" style={{ height: `${Math.max((day.visitors / Math.max(...analytics.daily_stats.map((d) => d.visitors), 1)) * 100, 4)}px` }}>
                            <div className="w-full bg-primary rounded-t" style={{ height: `${day.visitors > 0 ? (day.leads / day.visitors) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-body">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span>
                          <span className="text-xs font-body font-medium">{day.leads}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Leads Tab ──────────────────────────────────────── */}
            <TabsContent value="leads">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle className="font-heading text-lg">Lead Management ({filteredLeads.length})</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={leadFilter} onValueChange={setLeadFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs font-body"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-body text-xs">All Statuses</SelectItem>
                        {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-xs capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs font-body"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-body text-xs">All Priorities</SelectItem>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="font-body text-xs capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleExport} variant="outline" size="sm" className="font-body">
                      <Download className="w-4 h-4 mr-2" />Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-body text-muted-foreground">No leads match the current filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-body font-semibold">Name</TableHead>
                            <TableHead className="font-body font-semibold">Contact</TableHead>
                            <TableHead className="font-body font-semibold">Service</TableHead>
                            <TableHead className="font-body font-semibold">Priority</TableHead>
                            <TableHead className="font-body font-semibold">Status</TableHead>
                            <TableHead className="font-body font-semibold">Docs</TableHead>
                            <TableHead className="font-body font-semibold">Date</TableHead>
                            <TableHead className="font-body font-semibold w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLeads.map((lead) => {
                            const leadDocs = getLeadInvoices(lead.id);
                            return (
                              <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openLeadDetail(lead)}>
                                <TableCell className="font-body font-medium">
                                  <div className="flex items-center gap-2">
                                    {lead.name}
                                    {lead.notes && <StickyNote className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <span className="flex items-center gap-1 text-xs font-body text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</span>
                                    <span className="flex items-center gap-1 text-xs font-body text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-body text-sm">{getServiceLabel(lead.service_type)}</TableCell>
                                <TableCell>
                                  <Select value={lead.priority || "medium"} onValueChange={(v) => handlePriorityChange(lead.id, v)}>
                                    <SelectTrigger className={`w-[95px] h-7 text-xs font-body ${getPriorityColor(lead.priority)}`} onClick={(e) => e.stopPropagation()}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="font-body text-xs capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                                    <SelectTrigger className={`w-[115px] h-7 text-xs font-body ${getStatusColor(lead.status)}`} onClick={(e) => e.stopPropagation()}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-xs capitalize">{s}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {leadDocs.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap">
                                      {leadDocs.map((doc) => (
                                        <Badge key={doc.id} variant="outline" className={`text-xs font-body px-1.5 py-0 ${getInvoiceStatusColor(doc.status)}`}>
                                          {doc.invoice_number}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-body">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-body text-xs text-muted-foreground">
                                  {new Date(lead.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openLeadDetail(lead); }} className="font-body">
                                        <Eye className="w-4 h-4 mr-2" />View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertLeadToEstimate(lead); }} className="font-body">
                                        <ChevronRight className="w-4 h-4 mr-2" />Convert to Estimate
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }} className="text-destructive font-body">
                                        <Trash2 className="w-4 h-4 mr-2" />Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Invoices & Estimates Tab ───────────────────────── */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle className="font-heading text-lg">Invoices & Estimates ({filteredInvoices.length})</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs font-body"><SelectValue placeholder="Filter" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-body text-xs">All</SelectItem>
                        <SelectItem value="invoice" className="font-body text-xs">Invoices Only</SelectItem>
                        <SelectItem value="estimate" className="font-body text-xs">Estimates Only</SelectItem>
                        {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-xs capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => { setInvoiceType("estimate"); setInvoiceForm(BLANK_INVOICE_FORM); setShowInvoiceForm(true); }} variant="outline" size="sm" className="font-body">
                      <Plus className="w-4 h-4 mr-2" />New Estimate
                    </Button>
                    <Button onClick={() => { setInvoiceType("invoice"); setInvoiceForm(BLANK_INVOICE_FORM); setShowInvoiceForm(true); }} size="sm" className="font-body">
                      <Plus className="w-4 h-4 mr-2" />New Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-body text-muted-foreground">No invoices or estimates yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-body font-semibold">Number</TableHead>
                            <TableHead className="font-body font-semibold">Type</TableHead>
                            <TableHead className="font-body font-semibold">Client</TableHead>
                            <TableHead className="font-body font-semibold">Total</TableHead>
                            <TableHead className="font-body font-semibold">Status</TableHead>
                            <TableHead className="font-body font-semibold">Payment</TableHead>
                            <TableHead className="font-body font-semibold">Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((inv) => (
                            <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openInvoiceDetail(inv)}>
                              <TableCell className="font-body font-medium">{inv.invoice_number}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-body text-xs capitalize">{inv.type}</Badge>
                              </TableCell>
                              <TableCell className="font-body text-sm">{inv.client_name}</TableCell>
                              <TableCell className="font-body font-medium">${Number(inv.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Select value={inv.status} onValueChange={(v) => handleInvoiceStatusChange(inv.id, v)}>
                                  <SelectTrigger className={`w-[115px] h-7 text-xs font-body ${getInvoiceStatusColor(inv.status)}`} onClick={(e) => e.stopPropagation()}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-xs capitalize">{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {inv.stripe_payment_link ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-body" onClick={(e) => e.stopPropagation()}>
                                      Link
                                    </a>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleCopyLink(inv.stripe_payment_link)}>
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground font-body">—</span>
                                )}
                              </TableCell>
                              <TableCell className="font-body text-xs text-muted-foreground">
                                {new Date(inv.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openInvoiceDetail(inv); }} className="font-body">
                                      <Eye className="w-4 h-4 mr-2" />View Details
                                    </DropdownMenuItem>
                                    {inv.type === "estimate" && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertEstimateToInvoice(inv.id); }} className="font-body">
                                        <ArrowRightLeft className="w-4 h-4 mr-2" />Convert to Invoice
                                      </DropdownMenuItem>
                                    )}
                                    {resendConfigured && inv.client_email && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSendEmail(inv.id, inv.client_email); }} className="font-body">
                                        <Send className="w-4 h-4 mr-2" />Send Email
                                      </DropdownMenuItem>
                                    )}
                                    {inv.type === "invoice" && stripeConfigured && !inv.stripe_payment_link && (
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreatePaymentLink(inv.id); }} className="font-body">
                                        <CreditCard className="w-4 h-4 mr-2" />Create Payment Link
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id); }} className="text-destructive font-body">
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

            {/* ── Promo Banner Tab ───────────────────────────────── */}
            <TabsContent value="promo">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />Promotional Banner Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-body font-semibold">Enable Promo Banner</Label>
                      <p className="text-sm text-muted-foreground font-body">Show the promotional banner on the website</p>
                    </div>
                    <Switch checked={promoSettings.enabled} onCheckedChange={(c) => setPromoSettings({ ...promoSettings, enabled: c })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Title</Label>
                      <Input value={promoSettings.title} onChange={(e) => setPromoSettings({ ...promoSettings, title: e.target.value })} placeholder="Summer Build Special — 10% OFF!" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Subtitle</Label>
                      <Input value={promoSettings.subtitle} onChange={(e) => setPromoSettings({ ...promoSettings, subtitle: e.target.value })} placeholder="Book your project before the season fills up" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Button Text</Label>
                      <Input value={promoSettings.cta_text} onChange={(e) => setPromoSettings({ ...promoSettings, cta_text: e.target.value })} placeholder="Claim Offer" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Countdown Deadline</Label>
                      <Input type="date" value={promoSettings.deadline_date} onChange={(e) => setPromoSettings({ ...promoSettings, deadline_date: e.target.value })} className="font-body" />
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
                        <span className="bg-white text-accent px-3 py-1 rounded-full text-xs font-semibold">{promoSettings.cta_text || "CTA"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSavePromo} disabled={isSavingPromo} className="font-body">
                      <Save className="w-4 h-4 mr-2" />{isSavingPromo ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Settings Tab ───────────────────────────────────── */}
            <TabsContent value="settings" className="space-y-6">
              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Business Information</CardTitle>
                  <CardDescription className="font-body">Used on invoices and estimates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Business Name</Label>
                      <Input value={appSettings.business_name || ""} onChange={(e) => setAppSettings({ ...appSettings, business_name: e.target.value })} placeholder="Strctred Living Spaces" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Business Email</Label>
                      <Input type="email" value={appSettings.business_email || ""} onChange={(e) => setAppSettings({ ...appSettings, business_email: e.target.value })} placeholder="hello@example.com" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Phone</Label>
                      <Input value={appSettings.business_phone || ""} onChange={(e) => setAppSettings({ ...appSettings, business_phone: e.target.value })} placeholder="(905) 555-0100" className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body font-medium">Address</Label>
                      <Input value={appSettings.business_address || ""} onChange={(e) => setAppSettings({ ...appSettings, business_address: e.target.value })} placeholder="Hamilton, Ontario" className="font-body" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resend */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Send className="w-5 h-5" />Resend Email Integration
                  </CardTitle>
                  <CardDescription className="font-body">
                    Connect Resend to send invoices and estimates directly to clients by email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-body font-semibold">Enable Email Sending</Label>
                      <p className="text-sm text-muted-foreground font-body">Send invoices and estimates via Resend</p>
                    </div>
                    <Switch
                      checked={appSettings.resend_enabled === "true"}
                      onCheckedChange={(c) => setAppSettings({ ...appSettings, resend_enabled: c ? "true" : "false" })}
                    />
                  </div>

                  {appSettings.resend_enabled === "true" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-body text-amber-800">
                          Your API key is stored in the database and only used server-side. The masked value (••••••••) means a key is already saved.
                          Get your key at <strong>resend.com</strong> — you'll need to verify your sending domain first.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label className="font-body font-medium">API Key</Label>
                          <Input
                            type="password"
                            value={appSettings.resend_api_key || ""}
                            onChange={(e) => setAppSettings({ ...appSettings, resend_api_key: e.target.value })}
                            placeholder="re_..."
                            className="font-body font-mono text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-body font-medium">From Email</Label>
                            <Input
                              type="email"
                              value={appSettings.resend_from_email || ""}
                              onChange={(e) => setAppSettings({ ...appSettings, resend_from_email: e.target.value })}
                              placeholder="invoices@yourdomain.com"
                              className="font-body text-sm"
                            />
                            <p className="text-xs text-muted-foreground font-body">Must be on a verified domain in Resend.</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-body font-medium">From Name</Label>
                            <Input
                              value={appSettings.resend_from_name || ""}
                              onChange={(e) => setAppSettings({ ...appSettings, resend_from_name: e.target.value })}
                              placeholder="Strctred Living Spaces"
                              className="font-body text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stripe */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />Stripe Payment Integration
                  </CardTitle>
                  <CardDescription className="font-body">
                    Connect Stripe to generate payment links for invoices. Keys are stored encrypted in your database and never exposed to the browser.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-body font-semibold">Enable Stripe Payments</Label>
                      <p className="text-sm text-muted-foreground font-body">Allow payment link generation on invoices</p>
                    </div>
                    <Switch
                      checked={appSettings.stripe_enabled === "true"}
                      onCheckedChange={(c) => setAppSettings({ ...appSettings, stripe_enabled: c ? "true" : "false" })}
                    />
                  </div>

                  {appSettings.stripe_enabled === "true" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-body text-amber-800">
                          Never share your secret key. It is stored in your database and only used server-side. The masked value (••••••••) means a key is already saved — leave it as-is to keep the existing key, or paste a new key to replace it.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label className="font-body font-medium">Publishable Key</Label>
                          <Input
                            value={appSettings.stripe_publishable_key || ""}
                            onChange={(e) => setAppSettings({ ...appSettings, stripe_publishable_key: e.target.value })}
                            placeholder="pk_live_... or pk_test_..."
                            className="font-body font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-body font-medium">Secret Key</Label>
                          <Input
                            type="password"
                            value={appSettings.stripe_secret_key || ""}
                            onChange={(e) => setAppSettings({ ...appSettings, stripe_secret_key: e.target.value })}
                            placeholder="sk_live_... or sk_test_..."
                            className="font-body font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-body font-medium">Webhook Secret</Label>
                          <Input
                            type="password"
                            value={appSettings.stripe_webhook_secret || ""}
                            onChange={(e) => setAppSettings({ ...appSettings, stripe_webhook_secret: e.target.value })}
                            placeholder="whsec_..."
                            className="font-body font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground font-body">
                            Add this webhook endpoint in your Stripe dashboard: <code className="bg-muted px-1 rounded text-xs">/api/webhooks/stripe</code>. Listen for <code className="bg-muted px-1 rounded text-xs">checkout.session.completed</code> and <code className="bg-muted px-1 rounded text-xs">payment_intent.succeeded</code>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="font-body">
                  <Save className="w-4 h-4 mr-2" />{isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </TabsContent>

          </Tabs>
        )}
      </main>

      {/* ── Lead Detail Dialog ──────────────────────────────────── */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Lead Details</DialogTitle>
            <DialogDescription className="font-body">View and manage this lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Name</Label>
                  <p className="font-body font-medium">{selectedLead.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Service</Label>
                  <p className="font-body">{getServiceLabel(selectedLead.service_type)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Email</Label>
                  <a href={`mailto:${selectedLead.email}`} className="font-body text-primary hover:underline flex items-center gap-1 text-sm">
                    <Mail className="w-3 h-3" />{selectedLead.email}
                  </a>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Phone</Label>
                  <a href={`tel:${selectedLead.phone}`} className="font-body text-primary hover:underline flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3" />{selectedLead.phone}
                  </a>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Created</Label>
                  <p className="font-body text-sm">{new Date(selectedLead.created_at).toLocaleString()}</p>
                </div>
                {selectedLead.contacted_at && (
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">First Contacted</Label>
                    <p className="font-body text-sm">{new Date(selectedLead.contacted_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedLead.closed_at && (
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">Closed</Label>
                    <p className="font-body text-sm">{new Date(selectedLead.closed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              {selectedLead.message && (
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Message</Label>
                  <p className="font-body text-sm bg-muted/50 p-3 rounded-lg">{selectedLead.message}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-xs text-muted-foreground">Status</Label>
                  <Select value={selectedLead.status} onValueChange={(v) => { handleStatusChange(selectedLead.id, v); setSelectedLead({ ...selectedLead, status: v }); }}>
                    <SelectTrigger className={`h-9 text-sm font-body ${getStatusColor(selectedLead.status)}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-sm capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs text-muted-foreground">Priority</Label>
                  <Select value={selectedLead.priority || "medium"} onValueChange={(v) => { handlePriorityChange(selectedLead.id, v); setSelectedLead({ ...selectedLead, priority: v }); }}>
                    <SelectTrigger className={`h-9 text-sm font-body ${getPriorityColor(selectedLead.priority)}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="font-body text-sm capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-xs text-muted-foreground">Notes</Label>
                <Textarea value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)} placeholder="Add notes..." className="font-body min-h-[90px]" />
                <Button size="sm" onClick={() => handleSaveNotes(selectedLead.id)} className="font-body">
                  <Save className="w-3 h-3 mr-2" />Save Notes
                </Button>
              </div>

              {/* Associated documents */}
              {getLeadInvoices(selectedLead.id).length > 0 && (
                <div className="space-y-2">
                  <Label className="font-body text-xs text-muted-foreground">Estimates & Invoices</Label>
                  <div className="space-y-1">
                    {getLeadInvoices(selectedLead.id).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-body text-xs capitalize">{doc.type}</Badge>
                          <span className="font-body text-sm font-medium">{doc.invoice_number}</span>
                          <span className="font-body text-sm text-muted-foreground">${Number(doc.total).toFixed(2)}</span>
                        </div>
                        <Badge className={`font-body text-xs ${getInvoiceStatusColor(doc.status)}`}>{doc.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />
              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleConvertLeadToEstimate(selectedLead)} className="font-body">
                    <ChevronRight className="w-4 h-4 mr-2" />Convert to Estimate
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={() => { handleDeleteLead(selectedLead.id); setShowLeadDetail(false); }} className="font-body">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Invoice Detail Dialog ───────────────────────────────── */}
      <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {selectedInvoice?.type === "estimate" ? "Estimate" : "Invoice"} {selectedInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription className="font-body">View details and manage this document</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Client</Label>
                  <p className="font-body font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Email</Label>
                  <p className="font-body text-sm">{selectedInvoice.client_email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Phone</Label>
                  <p className="font-body text-sm">{selectedInvoice.client_phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Due Date</Label>
                  <p className="font-body text-sm">{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : "—"}</p>
                </div>
              </div>

              {/* Line items */}
              {selectedInvoice.items?.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-body text-xs text-muted-foreground">Line Items</Label>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-body text-xs">Description</TableHead>
                          <TableHead className="font-body text-xs text-right">Qty</TableHead>
                          <TableHead className="font-body text-xs text-right">Unit Price</TableHead>
                          <TableHead className="font-body text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-body text-sm">{item.description}</TableCell>
                            <TableCell className="font-body text-sm text-right">{Number(item.quantity)}</TableCell>
                            <TableCell className="font-body text-sm text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                            <TableCell className="font-body text-sm text-right">${Number(item.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm font-body">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(selectedInvoice.subtotal).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax ({Number(selectedInvoice.tax_rate)}%)</span><span>${Number(selectedInvoice.tax_amount).toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold text-base border-t pt-1.5"><span>Total</span><span>${Number(selectedInvoice.total).toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {selectedInvoice.notes && (
                <div className="space-y-1">
                  <Label className="font-body text-xs text-muted-foreground">Notes</Label>
                  <p className="font-body text-sm bg-muted/50 p-3 rounded-lg">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-body text-xs text-muted-foreground">Status</Label>
                <Select value={selectedInvoice.status} onValueChange={(v) => handleInvoiceStatusChange(selectedInvoice.id, v)}>
                  <SelectTrigger className={`h-9 text-sm font-body w-48 ${getInvoiceStatusColor(selectedInvoice.status)}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="font-body text-sm capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Email section */}
              <div className="space-y-2 p-4 border rounded-lg">
                <Label className="font-body font-semibold text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />Send by Email
                </Label>
                {resendConfigured ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={sendEmailTo || selectedInvoice?.client_email || ""}
                        onChange={(e) => setSendEmailTo(e.target.value)}
                        placeholder="client@email.com"
                        className="font-body text-sm h-8"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSendEmail(selectedInvoice.id, sendEmailTo || selectedInvoice?.client_email)}
                        disabled={isSendingEmail}
                        className="font-body whitespace-nowrap"
                      >
                        <Send className="w-3 h-3 mr-2" />
                        {isSendingEmail ? "Sending..." : "Send"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      Sends the {selectedInvoice?.type} with line items
                      {selectedInvoice?.stripe_payment_link ? " and a Pay Now button" : ""}.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Resend is not configured. Go to Settings to enable email sending.
                  </p>
                )}
              </div>

              {/* Payment link section */}
              {selectedInvoice.type === "invoice" && (
                <div className="space-y-2 p-4 border rounded-lg">
                  <Label className="font-body font-semibold text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />Stripe Payment
                  </Label>
                  {selectedInvoice.stripe_payment_link ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p className="text-xs font-body text-emerald-800 break-all flex-1">{selectedInvoice.stripe_payment_link}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCopyLink(selectedInvoice.stripe_payment_link)} className="font-body">
                          <Copy className="w-3 h-3 mr-2" />Copy Link
                        </Button>
                        <Button size="sm" variant="outline" asChild className="font-body">
                          <a href={selectedInvoice.stripe_payment_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-2" />Open
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : stripeConfigured ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-body">No payment link yet. Generate one to send to the client.</p>
                      <Button size="sm" onClick={() => handleCreatePaymentLink(selectedInvoice.id)} disabled={isCreatingPaymentLink} className="font-body">
                        <Link className="w-3 h-3 mr-2" />{isCreatingPaymentLink ? "Creating..." : "Generate Payment Link"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Stripe is not configured. Go to Settings to enable it.
                    </p>
                  )}
                </div>
              )}

              <Separator />
              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2 flex-wrap">
                  {selectedInvoice.type === "estimate" && (
                    <Button variant="outline" size="sm" onClick={() => handleConvertEstimateToInvoice(selectedInvoice.id)} className="font-body">
                      <ArrowRightLeft className="w-4 h-4 mr-2" />Convert to Invoice
                    </Button>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteInvoice(selectedInvoice.id)} className="font-body">
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Invoice / Estimate Creation Dialog ─────────────────── */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl capitalize">Create {invoiceType}</DialogTitle>
            <DialogDescription className="font-body">Fill in the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Type toggle */}
            <div className="flex gap-2">
              <Button variant={invoiceType === "estimate" ? "default" : "outline"} size="sm" onClick={() => setInvoiceType("estimate")} className="font-body">Estimate</Button>
              <Button variant={invoiceType === "invoice" ? "default" : "outline"} size="sm" onClick={() => setInvoiceType("invoice")} className="font-body">Invoice</Button>
            </div>
            {/* Client info */}
            <div className="space-y-4">
              <h3 className="font-body font-semibold text-xs text-muted-foreground uppercase tracking-wide">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Client Name *</Label>
                  <Input value={invoiceForm.client_name} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_name: e.target.value })} placeholder="John Smith" className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Email</Label>
                  <Input type="email" value={invoiceForm.client_email} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_email: e.target.value })} placeholder="john@example.com" className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Phone</Label>
                  <Input value={invoiceForm.client_phone} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_phone: e.target.value })} placeholder="(555) 123-4567" className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Due Date</Label>
                  <Input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className="font-body" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Address</Label>
                <Input value={invoiceForm.client_address} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_address: e.target.value })} placeholder="123 Main St, City, Province ZIP" className="font-body" />
              </div>
            </div>
            {/* Line items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-body font-semibold text-xs text-muted-foreground uppercase tracking-wide">Line Items</h3>
                <Button variant="outline" size="sm" onClick={addInvoiceItem} className="font-body"><Plus className="w-3 h-3 mr-1" />Add Item</Button>
              </div>
              <div className="space-y-2">
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6 space-y-1">
                      {index === 0 && <Label className="font-body text-xs text-muted-foreground">Description</Label>}
                      <Input value={item.description} onChange={(e) => updateInvoiceItem(index, "description", e.target.value)} placeholder="Service description" className="font-body text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {index === 0 && <Label className="font-body text-xs text-muted-foreground">Qty</Label>}
                      <Input type="number" min="0" step="0.5" value={item.quantity} onChange={(e) => updateInvoiceItem(index, "quantity", e.target.value)} className="font-body text-sm" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      {index === 0 && <Label className="font-body text-xs text-muted-foreground">Unit Price</Label>}
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateInvoiceItem(index, "unit_price", e.target.value)} placeholder="0.00" className="font-body text-sm" />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="sm" onClick={() => removeInvoiceItem(index)} disabled={invoiceForm.items.length <= 1} className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Totals */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-3">
                <Label className="font-body text-sm whitespace-nowrap">Tax Rate (%)</Label>
                <Input type="number" min="0" max="100" step="0.5" value={invoiceForm.tax_rate} onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: e.target.value })} className="font-body text-sm w-24" />
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm font-body">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${invoiceSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({Number(invoiceForm.tax_rate) || 0}%)</span><span>${invoiceTax.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold text-base border-t pt-2"><span>Total</span><span>${invoiceTotal.toFixed(2)}</span></div>
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-2">
              <Label className="font-body text-sm">Notes</Label>
              <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Additional notes or terms..." className="font-body min-h-[70px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowInvoiceForm(false)} className="font-body">Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={isSavingInvoice} className="font-body">
              <FileText className="w-4 h-4 mr-2" />{isSavingInvoice ? "Creating..." : `Create ${invoiceType === "invoice" ? "Invoice" : "Estimate"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
