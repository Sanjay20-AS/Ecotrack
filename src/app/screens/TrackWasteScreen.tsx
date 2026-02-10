import { useState, useEffect, useRef } from "react";
import { Camera, Calendar, MapPin, Save, X, Upload, LocateFixed, Leaf, Recycle, Truck, Sparkles, SwitchCamera } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar as CalendarPicker } from "../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { wasteAPI } from "../services/apiService";

export function TrackWasteScreen() {
  const [activeTab, setActiveTab] = useState("ewaste");
  const [allEntries, setAllEntries] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [logDate, setLogDate] = useState<Date | undefined>(undefined);
  const [logTime, setLogTime] = useState("09:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
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
    locationLatitude: 12.9716,
    locationLongitude: 77.5946,
  });

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWasteEntries();
  }, []);

  // Reset form when switching between tabs
  useEffect(() => {
    const defaultCondition = activeTab === "food" ? "fresh" : "working";
    const defaultDisposal = activeTab === "food" ? "compost" : "dropoff";
    
    setFormData(prev => ({
      ...prev,
      condition: defaultCondition,
      disposalMethod: defaultDisposal,
    }));
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

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
        // Sort by creation date (most recent first)
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
    setLoading(true);

    try {
      // Validation helper to show error and scroll to top
      const showValidationError = (message: string) => {
        setError(message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
      };

      // Validate required fields
      if (!formData.quantity || !formData.description) {
        showValidationError("Please fill in all required fields.");
        return;
      }

      // Validate address format
      if (!formData.locationAddress?.trim() || !validateAddress(formData.locationAddress)) {
        showValidationError("Please enter a complete address with door number, street name, area/city (e.g., '123 Main Street, Downtown, City, 123456').");
        return;
      }

      // Validate location coordinates if provided
      if (!validateCoordinates(formData.locationLatitude, formData.locationLongitude)) {
        showValidationError("Invalid location coordinates. Please use 'Get Current Location' or enter a valid address.");
        return;
      }

      // Validate phone number if provided
      if (!validatePhoneNumber(formData.contactPhone)) {
        showValidationError("Please enter a valid phone number (10-15 digits).");
        return;
      }

      // Validate quantity
      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0 || quantity > 1000) {
        showValidationError("Please enter a valid quantity between 0.1 and 1000 kg.");
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
        status: "PENDING"
      };

      console.log("Sending waste data:", wasteData); // Debug log

      await wasteAPI.createWaste(wasteData);
      setSuccess("Waste entry saved successfully!");
      
      // Scroll to top to ensure success message is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form with appropriate defaults based on active tab
      const defaultCondition = activeTab === "food" ? "fresh" : "working";
      const defaultDisposal = activeTab === "food" ? "compost" : "dropoff";
      
      setFormData({
        type: "E-WASTE",
        description: "",
        quantity: "",
        condition: defaultCondition,
        disposalMethod: defaultDisposal,
        pickupRequested: false,
        contactPhone: "",
        notes: "",
        locationAddress: "",
        locationLatitude: 12.9716,
        locationLongitude: 77.5946,
      });
      setLogDate(undefined);
      setLogTime("09:00");
      setPhotoPreview(null); // Clear photo preview after saving
      
      // Refresh entries
      setTimeout(() => {
        fetchWasteEntries();
        setSuccess("");
      }, 4000); // Extended to 4 seconds for better visibility
    } catch (err) {
      setError("Failed to save waste entry. Please try again.");
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
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
  };

  const updateWasteStatus = async (wasteId: number, newStatus: string) => {
    try {
      await wasteAPI.updateWaste(wasteId, { status: newStatus }, parseInt(userId || "0"));
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
          // Try to get readable address using reverse geocoding
          const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`);
          
          let addressText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          // Try using OpenStreetMap's Nominatim API (free alternative)
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

  const totalLoggedKg = allEntries.reduce(
    (sum: number, entry: any) => sum + (Number(entry.quantity) || 0),
    0
  );
  const eWasteKg = allEntries
    .filter((entry: any) => entry.type?.toLowerCase().includes("e"))
    .reduce((sum: number, entry: any) => sum + (Number(entry.quantity) || 0), 0);
  const foodWasteKg = allEntries
    .filter((entry: any) => entry.type?.toLowerCase().includes("food"))
    .reduce((sum: number, entry: any) => sum + (Number(entry.quantity) || 0), 0);
  const estimatedCO2Saved = totalLoggedKg * 2.5;
  const lastLogged = allEntries[0];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold">
          {userRole === "COLLECTOR" ? "Waste Management" : "Track Waste"}
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {userRole === "COLLECTOR" 
            ? "Manage collections and update waste status"
            : "Log your waste to track your impact"
          }
        </p>
        {userRole === "COLLECTOR" && (
          <div className="mt-3 text-xs bg-blue-500/20 px-3 py-2 rounded-lg">
            🚛 Collector tools: Update waste status, manage pickups
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Success/Error Messages - Positioned at top */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {success}
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
          
          <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 border border-gray-300 rounded-lg p-1">
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
          </TabsList>

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

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Description</Label>
                  <Input
                    type="text"
                    placeholder={
                      activeTab === "food" 
                        ? "e.g., Leftover Rice, Expired Milk, Vegetable Peels, Bread" 
                        : "e.g., Old Phone, Laptop, Tablet, Headphones, Charger"
                    }
                    className="h-12 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Weight or Quantity</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={
                      activeTab === "food"
                        ? "e.g., 1.5 (in kg or liters)"
                        : "e.g., 2.5 (in kg)"
                    }
                    className="h-12 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 relative" ref={calendarRef}>
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="h-12 px-3 shrink-0 border-2 border-gray-300 hover:bg-green-50 hover:border-green-300 bg-white"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
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
                    
                    {showCalendar && (
                      <div className="absolute z-50 top-full left-0 mt-2 p-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3">
                          <h3 className="font-medium text-sm">
                            {logDate ? 'Selected Date' : 'Select Date'}
                          </h3>
                          {logDate && (
                            <p className="text-xs opacity-90">
                              {logDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="p-3">
                          <CalendarPicker
                            mode="single"
                            selected={logDate}
                            onSelect={(date) => {
                              setLogDate(date);
                              setShowCalendar(false);
                            }}
                            className="w-auto"
                            initialFocus
                          />
                        </div>
                        <div className="bg-gray-50 px-3 py-2 flex justify-between items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogDate(new Date());
                              setShowCalendar(false);
                            }}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            Today
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCalendar(false)}
                            className="text-xs"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Time</Label>
                    <Select value={logTime} onValueChange={setLogTime}>
                      <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white text-gray-900">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-300 shadow-lg">
                        {[
                          "06:00",
                          "07:00",
                          "08:00",
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                          "16:00",
                          "17:00",
                          "18:00",
                          "19:00",
                          "20:00"
                        ].map((time) => (
                          <SelectItem key={time} value={time} className="text-gray-900 hover:bg-green-50">
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="space-y-2">
                  <Label>Location *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter address or use current location"
                      className="h-12 pr-10"
                      value={formData.locationAddress}
                      onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
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
                      {userRole === 'COLLECTOR' && entry.status === 'PENDING' && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => updateWasteStatus(entry.id, 'IN_PROGRESS')}
                          >
                            Mark In Progress
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
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full flex flex-col">
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
