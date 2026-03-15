import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Truck } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { userAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface UserItem {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  role: string;
  accountStatus: string;
  createdAt: string;
  organizationName?: string;
  vehicleType?: string;
  operationArea?: string;
  reasonForCollecting?: string;
}

export function AdminCollectorsScreen() {
  const [pendingCollectors, setPendingCollectors] = useState<UserItem[]>([]);
  const [allCollectors, setAllCollectors] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressMap, setAddressMap] = useState<Record<number, string>>({}); // Store resolved addresses
  
  // State for manage approval/rejection flows
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [approveReason, setApproveReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const adminId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    loadData();
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (error) {
      console.log("Reverse geocoding failed:", error);
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`; // Fallback to coordinates
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingData, allUsers] = await Promise.all([
        userAPI.getPendingCollectors(adminId),
        userAPI.getAllUsers(),
      ]);
      setPendingCollectors(pendingData);
      setAllCollectors(allUsers.filter((u: UserItem) => u.role === "COLLECTOR"));
      
      // Reverse geocode all collector locations
      const allCollectorDetails = [...pendingData, ...allUsers.filter((u: UserItem) => u.role === "COLLECTOR")];
      const newAddressMap: Record<number, string> = {};
      
      for (const collector of allCollectorDetails) {
        if (collector.latitude && collector.longitude && !addressMap[collector.id]) {
          const address = await reverseGeocode(collector.latitude, collector.longitude);
          newAddressMap[collector.id] = address;
        }
      }
      
      if (Object.keys(newAddressMap).length > 0) {
        setAddressMap((prev) => ({ ...prev, ...newAddressMap }));
      }
    } catch {
      toast.error("Failed to load collector data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatus = async (userId: number, status: string, reason?: string) => {
    setProcessing(true);
    try {
      await userAPI.updateAccountStatus(userId, status, adminId, reason);
      
      // Remove from pending list
      setPendingCollectors(pendingCollectors.filter(c => c.id !== userId));
      
      // Show success toast
      if (status === "ACTIVE") {
        toast.success("✅ Collector approved and notified!");
      } else if (status === "REJECTED") {
        toast.success("❌ Application rejected. Collector notified.");
      }
      
      // Close modals
      setApproveModalOpen(false);
      setRejectModalOpen(false);
      setApproveReason("");
      setRejectReason("");
      setProcessingId(null);
      
      // Reload to update all collectors list
      loadData();
    } catch (error) {
      toast.error("Failed to update account status");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const getVehicleEmoji = (vehicleType?: string) => {
    const emojiMap: Record<string, string> = {
      BICYCLE: "🚲",
      MOTORBIKE: "🛵",
      CAR: "🚗",
      TRUCK: "🚛",
      OTHER: "🔧",
    };
    return emojiMap[vehicleType || ""] || "🔧";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Collectors</h1>
        <p className="text-muted-foreground text-sm mt-1">Review applications and manage collector accounts</p>
      </div>

      {/* Pending Approval */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Pending Approval
          {pendingCollectors.length > 0 && (
            <Badge className="bg-amber-500 text-white">{pendingCollectors.length}</Badge>
          )}
        </h2>

        {pendingCollectors.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-lg">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending collector applications</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pendingCollectors.map((c) => (
              <Card key={c.id} className="p-4 border-amber-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    {c.phoneNumber && (
                      <p className="text-sm text-muted-foreground">📱 {c.phoneNumber}</p>
                    )}
                    {c.latitude && c.longitude && (
                      <p className="text-sm text-muted-foreground">📍 {addressMap[c.id] || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</p>
                    )}
                    {c.organizationName && (
                      <p className="text-sm text-muted-foreground">🏢 {c.organizationName}</p>
                    )}
                    {!c.organizationName && (
                      <p className="text-sm text-muted-foreground italic">🏢 Independent</p>
                    )}
                    {c.vehicleType && (
                      <p className="text-sm text-muted-foreground">{getVehicleEmoji(c.vehicleType)} {c.vehicleType.charAt(0) + c.vehicleType.slice(1).toLowerCase()}</p>
                    )}
                    {c.operationArea && (
                      <p className="text-sm text-muted-foreground">📌 {c.operationArea}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Applied: {formatDate(c.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 shrink-0">Pending</Badge>
                </div>
                {c.reasonForCollecting && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Why they want to collect:</p>
                    <p className="text-sm text-blue-700 italic">{c.reasonForCollecting}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1.5" 
                    onClick={() => {
                      setProcessingId(c.id);
                      setApproveReason("");
                      setApproveModalOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1 gap-1.5" 
                    onClick={() => {
                      setProcessingId(c.id);
                      setRejectReason("");
                      setRejectModalOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Collectors */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          All Collectors ({allCollectors.length})
        </h2>

        {allCollectors.length === 0 ? (
          <p className="text-muted-foreground text-sm">No collectors registered yet.</p>
        ) : (
          <div className="space-y-2">
            {allCollectors.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    {c.phoneNumber && (
                      <p className="text-sm text-muted-foreground">📱 {c.phoneNumber}</p>
                    )}
                    {c.latitude && c.longitude && (
                      <p className="text-sm text-muted-foreground">📍 {addressMap[c.id] || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.accountStatus} />
                    {c.accountStatus === "ACTIVE" && (
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleAccountStatus(c.id, "REJECTED")}>
                        Revoke
                      </Button>
                    )}
                    {c.accountStatus === "REJECTED" && (
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleAccountStatus(c.id, "ACTIVE")}>
                        Approve
                      </Button>
                    )}
                    {c.accountStatus === "PENDING_APPROVAL" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="text-xs h-8" onClick={() => handleAccountStatus(c.id, "ACTIVE")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => handleAccountStatus(c.id, "REJECTED")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Collector</DialogTitle>
            <DialogDescription>
              Add an optional welcome message for the collector.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Welcome Note (optional)</label>
              <Input
                placeholder="e.g., Welcome aboard! Looking forward to working with you."
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                disabled={processing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleAccountStatus(processingId!, "ACTIVE", approveReason || undefined)}
              disabled={processing}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the collector so they can improve their application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Rejection (optional)</label>
              <Textarea
                placeholder="e.g., Insufficient information provided, Area already has enough collectors, Please provide more details about your operation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={processing}
                className="min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleAccountStatus(processingId!, "REJECTED", rejectReason || undefined)}
              disabled={processing}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "bg-green-100 text-green-700 border-green-200" },
    PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <Badge variant="outline" className={`text-xs px-2 py-0.5 ${s.cls}`}>{s.label}</Badge>;
}
