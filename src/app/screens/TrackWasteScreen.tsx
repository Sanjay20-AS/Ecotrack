import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link } from "react-router";
import { Camera, Calendar, MapPin, Save, X, Upload, LocateFixed, Leaf, Recycle, Truck, Sparkles, SwitchCamera, Building2, CalendarClock, Gauge, TrendingDown, TrendingUp, BarChart3, Target, Bot, Trash2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
// CalendarPicker removed: use native date input only
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import toast from "react-hot-toast";
import { wasteAPI, wastePriorityAPI, pickupAPI, facilityAPI } from "../services/apiService";
import TopBar from "../components/TopBar";

interface WasteEntry {
  id: number;
  type: 'E-WASTE' | 'FOOD';
  description: string;
  quantity: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COLLECTED';
  createdAt: string;
  locationAddress?: string;
  imageUrl?: string;
}

interface AIClassificationResult {
  id: number;
  predictedCategory: string;
  itemName: string;
  predictedCondition: string;
  predictedDisposal: string;
  estimatedWeight: number;
  confidenceScore: number;
  notes?: string;
}

interface AnalyticsInsights {
  priority: { priorityScore: number; priorityLevel: string } | null;
  schedule: { pickupSchedule: string } | null;
  facility: { name: string; type: string } | null;
}

interface FieldErrors {
  description?: string;
  quantity?: string;
  locationAddress?: string;
}

export function TrackWasteScreen() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("ewaste");
  const [allEntries, setAllEntries] = useState<WasteEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState("");
  const errorMsgRef = useRef<HTMLDivElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [addressFromGps, setAddressFromGps] = useState(false);
  const [submissionInsights, setSubmissionInsights] = useState<AnalyticsInsights | null>(null);
  const [logDate, setLogDate] = useState<Date | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [formData, setFormData] = useState({
    type: "E-WASTE",
    description: "",
    quantity: "",
    condition: "working",
    disposalMethod: "dropoff",
    pickupRequested: false,
    contactPhone: "",
    notes: "",
    locationAddress: "",
    locationLatitude: 11.0168,
    locationLongitude: 76.9558,
    time: "09:00",
  });

  // time is stored in `formData.time` as 24-hour string "HH:MM"

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<"week" | "month" | "year">("month");

  // AI classification state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [aiClassificationId, setAiClassificationId] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastBase64, setLastBase64] = useState<string | null>(null);
  const [isApplyingAiResult, setIsApplyingAiResult] = useState(false);

  const getDefaultsForTab = (tab: string) => ({
    condition: tab === "food" ? "fresh" : "working",
    disposalMethod: tab === "food" ? "compost" : "dropoff",
  });

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  

  useEffect(() => {
    fetchWasteEntries();
    // Pre-check pickup if navigated from Locations screen
    if ((location.state as any)?.pickupRequested) {
      setFormData((prev) => ({ ...prev, pickupRequested: true }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, analyticsTimeRange]);

  // Handle applying AI results without infinite loop
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  useEffect(() => {
    if (isApplyingAiResult && pendingTab) {
      // Small delay to ensure form renders first
      const timer = setTimeout(() => {
        setActiveTab(pendingTab);
        setIsApplyingAiResult(false);
        setPendingTab(null);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isApplyingAiResult, pendingTab]);

  const fetchAnalytics = async () => {
    if (!userId) return;
    setAnalyticsLoading(true);
    try {
      const [analytics, trends] = await Promise.all([
        wasteAPI.getUserAnalytics(parseInt(userId), analyticsTimeRange),
        wasteAPI.getUserTrends(parseInt(userId), analyticsTimeRange),
      ]);
      setAnalyticsData({ analytics, trends });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Calendar popup removed; using native date input only

  // Validation helper functions
  const validateCoordinates = (lat: number, lng: number) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone.trim()) return true; // Optional field
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateAddress = (address: string) => {
    if (!address.trim()) return false; // Required field
    
    // Basic address validation - should have minimum components
    const trimmedAddress = address.trim();
    
    // Reject very short addresses
    if (trimmedAddress.length < 10) return false;
    
    // If this address was set from GPS reverse-geocoding, relax numeric requirement
    if (addressFromGps && trimmedAddress.length >= 5 && trimmedAddress.includes(",")) {
      return true;
    }

    // Should contain at least 3 components (door number, street, area)
    const addressParts = trimmedAddress.split(/[,\s]+/).filter(part => part.length > 0);
    if (addressParts.length < 3) return false;
    
    // Should contain at least one number (door number or pincode)
    const hasNumber = /\d/.test(trimmedAddress);
    if (!hasNumber) return false;
    
    // Should not be just random characters
    const validPattern = /^[a-zA-Z0-9\s,.-/#-]+$/;
    if (!validPattern.test(trimmedAddress)) return false;
    
    return true;
  };

  const fetchWasteEntries = async () => {
    try {
      if (userId) {
        const waste = await wasteAPI.getWasteByUserId(parseInt(userId));
        const sortedWaste = waste.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllEntries(sortedWaste);
        setRecentEntries(sortedWaste.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to fetch waste entries:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    setLoading(true);

    const newFieldErrors: FieldErrors = {};
    let hasErrors = false;

    try {
      // Validate description
      if (!formData.description?.trim()) {
        newFieldErrors.description = "Description is required";
        hasErrors = true;
      }

      // Validate quantity
      const quantity = parseFloat(formData.quantity);
      if (!formData.quantity?.trim()) {
        newFieldErrors.quantity = "Quantity is required";
        hasErrors = true;
      } else if (isNaN(quantity) || quantity <= 0 || quantity > 1000) {
        newFieldErrors.quantity = "Enter a valid quantity (0.1 - 1000 kg)";
        hasErrors = true;
      }

      // Validate address format
      if (!formData.locationAddress?.trim()) {
        newFieldErrors.locationAddress = "Location address is required";
        hasErrors = true;
      } else if (!validateAddress(formData.locationAddress)) {
        newFieldErrors.locationAddress = "Enter a complete address (e.g., '123 Main St, Downtown')";
        hasErrors = true;
      }

      // Set field errors and show them
      if (hasErrors) {
        setFieldErrors(newFieldErrors);
        toast.error("Please fix the errors below");
        const firstErrorElement = document.querySelector('[data-error-field]');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setLoading(false);
        return;
      }

      // Validate location coordinates if provided
      if (!validateCoordinates(formData.locationLatitude, formData.locationLongitude)) {
        setError("Invalid location coordinates. Please use 'Get Current Location' or enter a valid address.");
        toast.error("Invalid location coordinates");
        setTimeout(() => errorMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        setLoading(false);
        return;
      }

      // Validate phone number if provided
      if (!validatePhoneNumber(formData.contactPhone)) {
        toast.error("Please enter a valid phone number (10-15 digits).");
        setLoading(false);
        return;
      }

      const wasteData = {
        userId: parseInt(userId || "1"),
        type: activeTab === "food" ? "FOOD" : "E-WASTE",
        quantity: quantity,
        description: formData.description.trim(),
        locationLatitude: formData.locationLatitude,
        locationLongitude: formData.locationLongitude,
        locationAddress: formData.locationAddress.trim() || "Location not specified",
        time: formData.time,
        status: "PENDING"
      };

      console.log("Sending waste data:", wasteData); // Debug log

      // Geocode typed address if coordinates are missing, zero, or equal the fallback coords
      try {
        const lat = Number(wasteData.locationLatitude);
        const lng = Number(wasteData.locationLongitude);
        const fallbackLat = 11.0168;
        const fallbackLng = 76.9558;
        const isMissingOrZero = isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
        const isFallback = Math.abs(lat - fallbackLat) < 1e-6 && Math.abs(lng - fallbackLng) < 1e-6;
        if (isMissingOrZero || isFallback) {
          // Attempt Nominatim geocoding for the provided address
          const addr = (wasteData.locationAddress || "").trim();
          if (!addr) {
            toast.error("Could not resolve address coordinates. Please use GPS.");
            setLoading(false);
            return;
          }
          const tryFetch = async (query: string) => {
            try {
              const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`);
              if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.warn('Geocoding HTTP error', res.status, res.statusText, text);
                return null;
              }
              const js = await res.json();
              return js;
            } catch (ge) {
              console.warn('Geocoding fetch error (network/CORS?):', ge);
              return null;
            }
          };

          const parseGeo = (js: any) => {
            if (!js) return null;
            // Geoapify may return a 'results' array or a 'features' FeatureCollection
            try {
              if (js.results && js.results.length > 0 && js.results[0].properties) {
                const p = js.results[0].properties;
                if (p.lat != null && p.lon != null) return { lat: Number(p.lat), lon: Number(p.lon) };
              }
              if (js.features && js.features.length > 0 && js.features[0].properties) {
                const p = js.features[0].properties;
                if (p.lat != null && p.lon != null) return { lat: Number(p.lat), lon: Number(p.lon) };
                if (js.features[0].geometry && js.features[0].geometry.coordinates && js.features[0].geometry.coordinates.length >= 2) {
                  // geometry.coordinates is [lon, lat]
                  return { lat: Number(js.features[0].geometry.coordinates[1]), lon: Number(js.features[0].geometry.coordinates[0]) };
                }
              }
            } catch (e) {
              console.warn('Failed to parse geocode response', e, js);
            }
            return null;
          };

          // Attempt sequence: full address -> address + city -> area + city -> fallback city center
          const addrFull = (wasteData.locationAddress || "").trim();
          let coords = await parseGeo(await tryFetch(addrFull));
          if (!coords) {
            const q2 = `${addrFull}, Coimbatore, India`;
            coords = await parseGeo(await tryFetch(q2));
          }
          if (!coords) {
            const area = addrFull.split(',')[0].trim();
            if (area && area.length > 3) {
              const q3 = `${area}, Coimbatore, India`;
              coords = await parseGeo(await tryFetch(q3));
            }
          }
          if (!coords) {
            // Use Coimbatore city center as approximate fallback
            coords = { lat: 11.0168, lon: 76.9558 };
            toast("Using approximate location for this address");
          }
          wasteData.locationLatitude = coords.lat;
          wasteData.locationLongitude = coords.lon;
        }
      } catch (gErr) {
        console.error('Geocoding step failed:', gErr);
        toast.error("Could not resolve address coordinates. Please use GPS.");
        setLoading(false);
        return;
      }

      await wasteAPI.createWaste(wasteData);

      // Fetch algorithm insights for the submitted waste
      const fetchInsights = async () => {
        try {
          const [prio, sched, fac] = await Promise.all([
            wastePriorityAPI.calculatePriority(wasteData.type, wasteData.quantity, 0, 0).catch(() => null),
            pickupAPI.schedulePickup(wasteData.type, wasteData.quantity, 0, 5).catch(() => null),
            facilityAPI.getNearestFacility(wasteData.type, wasteData.locationLatitude, wasteData.locationLongitude).catch(() => null),
          ]);
          setSubmissionInsights({ priority: prio, schedule: sched, facility: fac });
        } catch { /* ignore */ }
      };
      fetchInsights();

      setSuccess("Waste entry saved successfully!");
      toast.success("Waste entry saved successfully!");
      
      // Scroll to top to ensure success message is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form with appropriate defaults based on active tab
      const defaults = getDefaultsForTab(activeTab);
      
      setFormData({
        type: activeTab === "food" ? "FOOD" : "E-WASTE",
        description: "",
        quantity: "",
        condition: defaults.condition,
        disposalMethod: defaults.disposalMethod,
        pickupRequested: false,
        contactPhone: "",
        notes: "",
        locationAddress: "",
        locationLatitude: 11.0168,
        locationLongitude: 76.9558,
      });
      setAddressFromGps(false);
      setLogDate(undefined);
      setFormData((prev) => ({ ...prev, time: "09:00" }));
      setPhotoPreview(null); // Clear photo preview after saving
      
      // Refresh entries
      setTimeout(() => {
        fetchWasteEntries();
        setSuccess("");
        setSubmissionInsights(null);
      }, 4000); // Extended to 4 seconds for better visibility
    } catch (err) {
      const msg = "Failed to save waste entry. Please try again.";
      setError(msg);
      toast.error(msg);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        analyseWithAI(base64);
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (tab: string) => {
    // If applying AI result, just change tab without resetting form
    if (isApplyingAiResult) {
      setActiveTab(tab);
      setIsApplyingAiResult(false);
      return;
    }

    // User-triggered tab change: reset form to defaults
    setActiveTab(tab);
    const defaults = getDefaultsForTab(tab);
    setFormData((prev) => ({
      ...prev,
      type: tab === "food" ? "FOOD" : "E-WASTE",
      condition: defaults.condition,
      disposalMethod: defaults.disposalMethod,
    }));
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait a bit for the modal to render, then set video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions and ensure you are using HTTPS.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setPhotoPreview(imageData);
        stopCamera();
        analyseWithAI(imageData);
      }
    } else {
      setError('Camera not ready. Please wait for the camera to load.');
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    
    // Stop current stream
    if (stream) {
      stopCamera();
      
      // Wait and restart with new camera
      setTimeout(async () => {
        setFacingMode(newFacingMode);
        try {
          const constraints = {
            video: { 
              facingMode: newFacingMode,
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            }
          };
          
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          setStream(mediaStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
        } catch (error) {
          console.error('Error switching camera:', error);
          setError('Unable to switch camera.');
        }
      }, 200);
    }
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const removePhoto = () => {
    setPhotoPreview(null);
    setAiResult(null);
    setAiClassificationId(null);
    setAiError(null);
    setLastBase64(null);
  };

  const analyseWithAI = async (base64: string) => {
    if (!userId) return;
    setAiLoading(true);
    setAiResult(null);
    setAiClassificationId(null);
    setAiError(null);
    setLastBase64(base64);
    try {
      const result = await wasteAPI.classifyImage(parseInt(userId), base64);
      setAiResult(result);
      setAiClassificationId(result.id);
    } catch (err: any) {
      if (err?.status === 429) {
        setAiError('rate_limit');
      } else {
        setAiError('failed');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = (accepted: boolean) => {
    if (!aiResult) return;

    // Normalise category — model may return "food waste", "e-waste", "ewaste", etc.
    const rawCategory = (aiResult.predictedCategory || "").toLowerCase();
    const isEwaste = rawCategory.includes("e-waste") || rawCategory.includes("ewaste") ||
                     rawCategory.includes("electronic") || rawCategory === "e_waste";

    // Normalise condition (case-insensitive, partial match)
    const rawCond = (aiResult.predictedCondition || "").toLowerCase();
    let condition: string;
    if (isEwaste) {
      if (rawCond.includes("repair") || rawCond.includes("repairable")) condition = "repairable";
      else if (rawCond.includes("broken") || rawCond.includes("damaged") || rawCond.includes("defective")) condition = "broken";
      else condition = "working";
    } else {
      if (rawCond.includes("expir") || rawCond.includes("near")) condition = "expired";
      else if (rawCond.includes("spoil") || rawCond.includes("rotten")) condition = "spoiled";
      else if (rawCond.includes("surplus") || rawCond.includes("leftover") || rawCond.includes("left over")) condition = "leftover";
      else condition = "fresh";
    }

    // Normalise disposal method (case-insensitive, partial match)
    const rawDisposal = (aiResult.predictedDisposal || "").toLowerCase();
    let disposalMethod: string;
    if (isEwaste) {
      if (rawDisposal.includes("pickup") || rawDisposal.includes("pick up") || rawDisposal.includes("pick-up")) disposalMethod = "pickup";
      else if (rawDisposal.includes("donat") || rawDisposal.includes("reuse")) disposalMethod = "donate";
      else if (rawDisposal.includes("repair") || rawDisposal.includes("shop")) disposalMethod = "repair";
      else disposalMethod = "dropoff"; // "drop-off", "drop off", "dropoff", or default
    } else {
      if (rawDisposal.includes("food bank") || rawDisposal.includes("food-bank") || rawDisposal.includes("foodbank")) disposalMethod = "food-bank";
      else if (rawDisposal.includes("donat") || rawDisposal.includes("community")) disposalMethod = "donation";
      else if (rawDisposal.includes("home") || rawDisposal.includes("process")) disposalMethod = "home-processing";
      else if (rawDisposal.includes("municipal") || rawDisposal.includes("collect")) disposalMethod = "municipal";
      else disposalMethod = "compost"; // "compost", "organic", or default
    }

    const savedId = aiClassificationId;
    
    // Queue tab change via state instead of directly calling setActiveTab
    const newTab = isEwaste ? "ewaste" : "food";
    setPendingTab(newTab);
    setIsApplyingAiResult(true);
    
    // Set form data with all AI values
    setFormData(prev => ({
      ...prev,
      type: isEwaste ? "E-WASTE" : "FOOD",
      description: typeof aiResult.itemName === "string" ? aiResult.itemName.trim() : "",
      quantity: aiResult.estimatedWeight != null ? String(aiResult.estimatedWeight) : "",
      condition,
      disposalMethod,
      notes: typeof aiResult.notes === "string" ? aiResult.notes.trim() : "",
    }));

    setAiResult(null);
    setAiClassificationId(null);

    if (savedId) {
      wasteAPI.updateClassificationAccepted(savedId, accepted).catch(() => {});
    }
  };

  const updateWasteStatus = async (wasteId: number, newStatus: string) => {
    try {
      await wasteAPI.updateWasteStatus(wasteId, newStatus, parseInt(userId || "0"));
      // Refresh entries to show updated status
      fetchWasteEntries();
    } catch (error) {
      console.error("Error updating waste status:", error);
      setError("Failed to update waste status");
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError("");
    setLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get readable address using free OpenStreetMap Nominatim API
          let addressText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          try {
            const osmResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (osmResponse.ok) {
              const osmData = await osmResponse.json();
              if (osmData && osmData.display_name) {
                addressText = osmData.display_name;
              }
            }
          } catch (osmError) {
            console.log('Reverse geocoding failed, using coordinates:', osmError);
          }
          
          setFormData((prev) => ({
            ...prev,
            locationLatitude: latitude,
            locationLongitude: longitude,
            locationAddress: addressText,
          }));
          setAddressFromGps(true);
        } catch (error) {
          console.log('Address lookup failed, using coordinates:', error);
          setFormData((prev) => ({
            ...prev,
            locationLatitude: latitude,
            locationLongitude: longitude,
            locationAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
        }
        
        setLocating(false);
      },
      () => {
        setError("Unable to fetch your location. Please enter it manually.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLocating(false);
      }
    );
  };

  // Compute stats with memoization
  const { totalLoggedKg, eWasteKg, foodWasteKg, estimatedCO2Saved } = useMemo(() => {
    const total = allEntries.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
    const eWaste = allEntries
      .filter((e) => e.type === "E-WASTE")
      .reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
    const food = allEntries
      .filter((e) => e.type === "FOOD")
      .reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
    return {
      totalLoggedKg: total,
      eWasteKg: eWaste,
      foodWasteKg: food,
      estimatedCO2Saved: total * 2.5
    };
  }, [allEntries]);
  const lastLogged = allEntries[0];

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar variant="banner" title="Track Waste" subtitle="Log waste and track your impact" />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
        {/* Real-world Impact Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Logged</span>
            </div>
            <p className="text-2xl font-bold">{totalLoggedKg.toFixed(1)}kg</p>
            <p className="text-xs text-muted-foreground">All-time waste tracked</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">CO₂ Saved</span>
            </div>
            <p className="text-2xl font-bold">{estimatedCO2Saved.toFixed(1)}kg</p>
            <p className="text-xs text-muted-foreground">Estimated impact</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Recycle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">E-waste</span>
            </div>
            <p className="text-2xl font-bold">{eWasteKg.toFixed(1)}kg</p>
            <p className="text-xs text-muted-foreground">Devices & electronics</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">Food Waste</span>
            </div>
            <p className="text-2xl font-bold">{foodWasteKg.toFixed(1)}kg</p>
            <p className="text-xs text-muted-foreground">Kitchen & compost</p>
          </Card>
        </div>

        {lastLogged && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Last Logged</span>
            </div>
            <p className="font-semibold">{lastLogged.description}</p>
            <p className="text-sm text-muted-foreground">
              {lastLogged.quantity}kg • {new Date(lastLogged.createdAt).toLocaleDateString()}
            </p>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Success/Error Messages - Positioned at top */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {success}
              </div>
            </div>
          )}

          {/* Algorithm Insights after submission */}
          {submissionInsights && (
            <div className="space-y-2 mb-4 animate-in fade-in">
              {submissionInsights.priority && (
                <Card className="p-3 bg-orange-50 border-orange-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium flex items-center gap-1 text-orange-800">
                      <Gauge className="h-3.5 w-3.5" /> Priority Score
                    </span>
                    <span className={`text-xs font-bold ${
                      submissionInsights.priority.priorityLevel === "HIGH" ? "text-orange-700" : "text-gray-600"
                    }`}>
                      {submissionInsights.priority.priorityScore.toFixed(1)} — {submissionInsights.priority.priorityLevel}
                    </span>
                  </div>
                  <Progress value={Math.min(submissionInsights.priority.priorityScore, 100)} className="h-2" />
                </Card>
              )}
              {submissionInsights.schedule && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">Estimated Pickup Schedule</p>
                      <p className="text-xs text-blue-700 mt-0.5">{submissionInsights.schedule.pickupSchedule}</p>
                    </div>
                  </div>
                </Card>
              )}
              {submissionInsights.facility && (
                <Card className="p-3 bg-purple-50 border-purple-200">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-purple-800">Nearest Recycling Facility</p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        {submissionInsights.facility.name} ({submissionInsights.facility.type})
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
          {error && (
            <div ref={errorMsgRef} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
          
          <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 border border-gray-300 rounded-lg p-1">
            <TabsTrigger 
              value="ewaste" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-700 font-medium border border-transparent data-[state=active]:border-gray-200"
            >
              E-waste
            </TabsTrigger>
            <TabsTrigger 
              value="food" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-700 font-medium border border-transparent data-[state=active]:border-gray-200"
            >
              Food Waste
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-700 font-medium border border-transparent data-[state=active]:border-gray-200"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab !== "analytics" && (
          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {/* Photo Capture Section */}
            <div className="space-y-3">
              {!photoPreview ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={startCamera}
                    size="lg" 
                    className="h-24 flex-col gap-2 w-full"
                  >
                    <Camera className="h-8 w-8" />
                    <span>Open Camera</span>
                  </Button>

                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                    <Button asChild size="lg" variant="secondary" className="h-24 flex-col gap-2 w-full cursor-pointer">
                      <div>
                        <Upload className="h-8 w-8" />
                        <span>Upload Photo</span>
                      </div>
                    </Button>
                  </label>
                </div>
              ) : (
                <Card className="p-4 space-y-3">
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Waste photo preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                      <Button asChild variant="outline" className="w-full cursor-pointer">
                        <div>Change Photo</div>
                      </Button>
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1"
                      onClick={removePhoto}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* AI Classification */}
            {aiLoading && (
              <Card className="p-4 flex items-center gap-3 bg-blue-50 border-blue-200">
                <Bot className="h-5 w-5 text-blue-600 animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-blue-700">Analysing your photo...</p>
                  <p className="text-xs text-blue-500">AI is classifying your waste</p>
                </div>
              </Card>
            )}

            {aiError && !aiLoading && (
              <Card className="p-4 flex items-center justify-between gap-3 bg-amber-50 border-amber-200">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">
                      {aiError === 'rate_limit' ? 'AI is busy right now' : 'AI analysis unavailable'}
                    </p>
                    <p className="text-xs text-amber-600">
                      {aiError === 'rate_limit' ? 'Tap retry to try again' : 'Fill in the form manually'}
                    </p>
                  </div>
                </div>
                {(aiError === 'rate_limit' || aiError === 'failed') && lastBase64 && (
                  <Button size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700" onClick={() => analyseWithAI(lastBase64)}>
                    Retry
                  </Button>
                )}
              </Card>
            )}

            {aiResult && !aiLoading && (
              <Card className="p-4 space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-sm text-blue-800">AI Classification Result</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {aiResult.confidenceScore}% confident
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{aiResult.predictedCategory}</span></div>
                  <div><span className="text-muted-foreground">Item:</span> <span className="font-medium">{aiResult.itemName}</span></div>
                  <div><span className="text-muted-foreground">Condition:</span> <span className="font-medium">{aiResult.predictedCondition}</span></div>
                  <div><span className="text-muted-foreground">Disposal:</span> <span className="font-medium">{aiResult.predictedDisposal}</span></div>
                  <div><span className="text-muted-foreground">Est. Weight:</span> <span className="font-medium">{aiResult.estimatedWeight} kg</span></div>
                </div>
                {aiResult.notes && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2">{aiResult.notes}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => applyAiResult(true)}>
                    Use these details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => applyAiResult(false)}>
                    Edit manually
                  </Button>
                </div>
              </Card>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card className="p-4 space-y-4">
                <div className="space-y-2" data-error-field="description">
                  <Label className="text-gray-700 font-medium">Description</Label>
                  <Input
                    type="text"
                    placeholder={
                      activeTab === "food" 
                        ? "e.g., Leftover Rice, Expired Milk, Vegetable Peels, Bread" 
                        : "e.g., Old Phone, Laptop, Tablet, Headphones, Charger"
                    }
                    className={`h-12 border-2 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 ${
                      fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (fieldErrors.description) {
                        setFieldErrors({ ...fieldErrors, description: undefined });
                      }
                    }}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2" data-error-field="quantity">
                  <Label className="text-gray-700 font-medium">Weight or Quantity</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={
                      activeTab === "food"
                        ? "e.g., 1.5 (in kg or liters)"
                        : "e.g., 2.5 (in kg)"
                    }
                    className={`h-12 border-2 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 ${
                      fieldErrors.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      if (fieldErrors.quantity) {
                        setFieldErrors({ ...fieldErrors, quantity: undefined });
                      }
                    }}
                    required
                  />
                  {fieldErrors.quantity && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.quantity}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Date</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={logDate ? logDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setLogDate(new Date(e.target.value));
                          } else {
                            setLogDate(undefined);
                          }
                        }}
                        className="h-12 flex-1 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="Enter date manually"
                      />
                      {/* Using native date input only; calendar popup removed */}
                    </div>
                    {logDate && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Selected: {logDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    
                    {/* calendar popup removed */}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Time</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="h-12 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">{activeTab === "food" ? "Freshness" : "Condition"}</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900">
                        <SelectValue placeholder={`Select ${activeTab === "food" ? "freshness" : "condition"}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-300 shadow-lg">
                        {activeTab === "food" ? (
                          <>
                            <SelectItem value="fresh" className="text-gray-900 hover:bg-green-50">Fresh/Edible</SelectItem>
                            <SelectItem value="expired" className="text-gray-900 hover:bg-green-50">Expired</SelectItem>
                            <SelectItem value="spoiled" className="text-gray-900 hover:bg-green-50">Spoiled</SelectItem>
                            <SelectItem value="leftover" className="text-gray-900 hover:bg-green-50">Leftover</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="working" className="text-gray-900 hover:bg-green-50">Working</SelectItem>
                            <SelectItem value="repairable" className="text-gray-900 hover:bg-green-50">Needs Repair</SelectItem>
                            <SelectItem value="broken" className="text-gray-900 hover:bg-green-50">Broken</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Disposal Method</Label>
                    <Select
                      value={formData.disposalMethod}
                      onValueChange={(value) => setFormData({ ...formData, disposalMethod: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTab === "food" ? (
                          <>
                            <SelectItem value="compost">Compost/Organic Bin</SelectItem>
                            <SelectItem value="municipal">Municipal Collection</SelectItem>
                            <SelectItem value="food-bank">Food Bank (Edible Leftovers)</SelectItem>
                            <SelectItem value="donation">Community Donation</SelectItem>
                            <SelectItem value="home-processing">Home Processing</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="dropoff">Drop-off Center</SelectItem>
                            <SelectItem value="pickup">Pickup Service</SelectItem>
                            <SelectItem value="donate">Donate/Reuse</SelectItem>
                            <SelectItem value="repair">Repair Shop</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2" data-error-field="locationAddress">
                  <Label>Location *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter address or use current location"
                      className={`h-12 pr-10 border-2 focus:border-green-500 focus:ring-green-500 ${
                        fieldErrors.locationAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.locationAddress}
                      onChange={(e) => {
                        setFormData({ ...formData, locationAddress: e.target.value });
                        setAddressFromGps(false);
                        if (fieldErrors.locationAddress) {
                          setFieldErrors({ ...fieldErrors, locationAddress: undefined });
                        }
                      }}
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                  {fieldErrors.locationAddress && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.locationAddress}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                  >
                    <LocateFixed className="mr-2 h-4 w-4" />
                    {locating ? "Detecting location..." : "Use Current Location"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Pickup Needed</Label>
                    <div className="flex items-center gap-2 h-12">
                      <input
                        type="checkbox"
                        checked={formData.pickupRequested}
                        onChange={(e) => setFormData({ ...formData, pickupRequested: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-muted-foreground">Schedule pickup</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      placeholder="e.g., +91 98765 43210 (Optional)"
                      className="h-12"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                    {formData.contactPhone && !validatePhoneNumber(formData.contactPhone) && (
                      <p className="text-xs text-red-600">Please enter a valid phone number</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Notes (Optional)</Label>
                  <textarea
                    className="w-full rounded-md border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 p-3 text-sm"
                    rows={3}
                    placeholder="Add extra details (condition, packaging, special instructions)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
                  <Save className="mr-2 h-5 w-5" />
                  {loading ? "Saving..." : "Save Entry"}
                </Button>
              </Card>
            </form>
          </TabsContent>
          )}

          <TabsContent value="analytics" className="space-y-4 mt-6">
            {/* Analytics Time Range */}
            <div className="flex gap-2">
              {(["week", "month", "year"] as const).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={analyticsTimeRange === r ? "default" : "outline"}
                  onClick={() => setAnalyticsTimeRange(r)}
                  className="capitalize"
                >
                  {r}
                </Button>
              ))}
            </div>

            {analyticsLoading ? (
              <Card className="p-8 text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                Loading analytics...
              </Card>
            ) : analyticsData ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Total Waste</span>
                    </div>
                    <p className="text-2xl font-bold">{analyticsData.analytics?.totalWaste ?? 0}kg</p>
                    <div className="flex items-center gap-1 mt-1">
                      {(analyticsData.analytics?.changePercentage ?? 0) < 0
                        ? <TrendingDown className="h-4 w-4 text-green-500" />
                        : <TrendingUp className="h-4 w-4 text-red-500" />}
                      <span className={`text-xs ${
                        (analyticsData.analytics?.changePercentage ?? 0) < 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {Math.abs(analyticsData.analytics?.changePercentage ?? 0).toFixed(1)}% vs prev period
                      </span>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Recycle className="h-5 w-5 text-secondary" />
                      <span className="text-sm font-medium">Entries</span>
                    </div>
                    <p className="text-2xl font-bold">{analyticsData.analytics?.entryCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">This {analyticsTimeRange}</p>
                  </Card>
                </div>

                {/* Waste by Category */}
                {analyticsData.analytics?.wasteByCategory &&
                  Object.keys(analyticsData.analytics.wasteByCategory).length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> By Category
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.analytics.wasteByCategory).map(
                        ([cat, kg]: [string, any], i) => {
                          const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-yellow-500", "bg-purple-500"];
                          const total = Object.values(analyticsData.analytics.wasteByCategory as Record<string, number>).reduce((a: number, b) => a + Number(b), 0);
                          const pct = total > 0 ? (Number(kg) / total) * 100 : 0;
                          return (
                            <div key={cat}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{cat}</span>
                                <span className="text-muted-foreground">{Number(kg).toFixed(1)}kg</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colors[i % colors.length]} rounded-full`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </Card>
                )}

                {/* Trend bars */}
                {analyticsData.trends?.trends?.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Trend
                    </h3>
                    <div className="flex items-end gap-1 h-24">
                      {analyticsData.trends.trends.map((t: any, i: number) => {
                        const max = Math.max(...analyticsData.trends.trends.map((x: any) => Number(x.waste) || 0), 1);
                        const h = Math.max((Number(t.waste) / max) * 100, 2);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full bg-primary/80 rounded-t"
                              style={{ height: `${h}%` }}
                              title={`${t.period}: ${Number(t.waste).toFixed(1)}kg`}
                            />
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">{t.period}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <Link to="/app/analytics">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" /> View Full Analytics
                  </Button>
                </Link>
              </>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                No analytics data yet. Start logging waste to see your impact!
              </Card>
            )}
          </TabsContent>

        </Tabs>

        {/* Recent Entries */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Entries</h2>
          {recentEntries.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No waste entries yet. Start logging your waste!
            </Card>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry: any) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {entry.type}
                        </span>
                        <span className="text-sm font-medium">{entry.quantity}kg</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          entry.status === 'COLLECTED' ? 'bg-green-100 text-green-700' :
                          entry.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]">
          <div className="w-full h-full flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Camera Header */}
            <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
              <Button
                onClick={stopCamera}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="text-white font-medium">Take Photo</h3>
              <Button
                onClick={switchCamera}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            </div>

            {/* Camera View */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    // Ensure video plays when metadata is loaded
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                />
                <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none"></div>
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center items-center p-6 bg-black/30">
              <div className="flex items-center gap-6">
                <Button
                  onClick={() => setShowCamera(false)}
                  variant="outline"
                  size="lg"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 p-0 shadow-lg"
                  disabled={!stream}
                >
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-inner"></div>
                </Button>

                <div className="text-white text-sm text-center min-w-[60px]">
                  {stream ? 'Ready' : 'Loading...'}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
