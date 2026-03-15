import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { facilityAPI } from "../../services/apiService";
import toast from "react-hot-toast";

interface Facility {
  id: number;
  name: string;
  type: string;
  address?: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  email?: string;
  capacityKg: number;
  currentUsageKg: number;
  operatingHours?: string;
  description?: string;
  active: boolean;
}

const FACILITY_TYPES = ["NGO", "RECYCLER", "COMPOST_SITE", "LANDFILL", "E-WASTE_CENTER"];

const typeColors: Record<string, string> = {
  NGO: "bg-blue-100 text-blue-700 border-blue-200",
  RECYCLER: "bg-green-100 text-green-700 border-green-200",
  COMPOST_SITE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LANDFILL: "bg-orange-100 text-orange-700 border-orange-200",
  "E-WASTE_CENTER": "bg-purple-100 text-purple-700 border-purple-200",
};

const emptyForm = {
  name: "",
  type: "NGO",
  address: "",
  latitude: "",
  longitude: "",
  phoneNumber: "",
  email: "",
  capacityKg: "",
  operatingHours: "",
  description: "",
  active: true,
};

export function AdminFacilitiesScreen() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const data = await facilityAPI.getAllFacilities();
      setFacilities(data);
    } catch {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (f: Facility) => {
    setEditing(f);
    setForm({
      name: f.name,
      type: f.type,
      address: f.address || "",
      latitude: String(f.latitude),
      longitude: String(f.longitude),
      phoneNumber: f.phoneNumber || "",
      email: f.email || "",
      capacityKg: String(f.capacityKg),
      operatingHours: f.operatingHours || "",
      description: f.description || "",
      active: f.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.latitude || !form.longitude) {
      toast.error("Name, latitude and longitude are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      type: form.type,
      address: form.address,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      phoneNumber: form.phoneNumber,
      email: form.email,
      capacityKg: parseFloat(form.capacityKg) || 0,
      operatingHours: form.operatingHours,
      description: form.description,
      active: form.active,
    };
    try {
      if (editing) {
        await facilityAPI.updateFacility(editing.id, payload);
        toast.success("Facility updated");
      } else {
        await facilityAPI.createFacility(payload);
        toast.success("Facility created");
      }
      setShowForm(false);
      loadFacilities();
    } catch {
      toast.error("Failed to save facility");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete facility "${name}"?`)) return;
    try {
      await facilityAPI.deleteFacility(id);
      toast.success("Facility deleted");
      loadFacilities();
    } catch {
      toast.error("Failed to delete facility");
    }
  };

  const handleToggleActive = async (f: Facility) => {
    try {
      await facilityAPI.updateFacility(f.id, { ...f, active: !f.active });
      toast.success(`Facility ${f.active ? "deactivated" : "activated"}`);
      loadFacilities();
    } catch {
      toast.error("Failed to update facility");
    }
  };

  const filtered = facilities.filter((f) =>
    filterType === "ALL" ? true : f.type === filterType
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facilities</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage recycling and waste disposal facilities</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Facility
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", ...FACILITY_TYPES].map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filterType === t ? "default" : "outline"}
            onClick={() => setFilterType(t)}
          >
            {t === "ALL" ? "All" : t.replace("_", " ")}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} facilities</p>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Facility" : "Add Facility"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Facility name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  {FACILITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Latitude *</label>
                  <Input
                    type="number"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="e.g. 13.0827"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Longitude *</label>
                  <Input
                    type="number"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="e.g. 80.2707"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+91..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Capacity (kg)</label>
                  <Input
                    type="number"
                    value={form.capacityKg}
                    onChange={(e) => setForm({ ...form, capacityKg: e.target.value })}
                    placeholder="Max capacity"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Operating Hours</label>
                  <Input
                    value={form.operatingHours}
                    onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                    placeholder="e.g. 9am–6pm"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                  className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                Active
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No facilities found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openAdd}>Add first facility</Button>
          </div>
        ) : (
          filtered.map((f) => (
            <Card key={f.id} className={`p-4 ${!f.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold">{f.name}</p>
                    <Badge variant="outline" className={`text-xs ${typeColors[f.type] || ""}`}>
                      {f.type.replace("_", " ")}
                    </Badge>
                    {f.active
                      ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs" variant="outline">Active</Badge>
                      : <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs" variant="outline">Inactive</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {f.address && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{f.address}</p>}
                    {f.phoneNumber && <p>📞 {f.phoneNumber}</p>}
                    {f.operatingHours && <p>🕐 {f.operatingHours}</p>}
                    {f.capacityKg > 0 && (
                      <p>
                        Capacity: {f.currentUsageKg} / {f.capacityKg} kg
                        <span className="ml-2 text-xs">
                          ({f.capacityKg > 0 ? Math.round((f.currentUsageKg / f.capacityKg) * 100) : 0}% used)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title={f.active ? "Deactivate" : "Activate"}
                    onClick={() => handleToggleActive(f)}
                  >
                    {f.active
                      ? <XCircle className="h-4 w-4 text-muted-foreground" />
                      : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(f)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(f.id, f.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
