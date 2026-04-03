## BACKEND CODE

### Aggregated Backend Excerpts (~200 lines)

Below are concatenated important snippets from backend sources: controllers, upload handler, entity and priority service.

---

File: backend/src/main/java/com/ecotrack/backend/controller/WasteTrackingController.java
```java
package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.WasteCreateRequest;
import com.ecotrack.backend.model.AccountStatus;
import com.ecotrack.backend.model.Role;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.repository.WasteRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.NotificationService;
import com.ecotrack.backend.service.WastePriorityService;
import com.ecotrack.backend.service.WasteValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/waste")
public class WasteTrackingController {

  @Autowired
  private WasteRepository wasteRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private WasteValidationService wasteValidationService;

  @Autowired
  private WastePriorityService wastePriorityService;

  @Autowired
  private NotificationService notificationService;

  @GetMapping
  public List<Waste> getAllWaste() { return wasteRepository.findAll(); }

  @PostMapping
  public ResponseEntity<?> createWaste(@RequestBody WasteCreateRequest request) {
    try {
      List<String> validationErrors = wasteValidationService.validateWasteRequest(request);
      if (!validationErrors.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("error","Validation failed","details",validationErrors));
      }
      Optional<User> userOptional = userRepository.findById(request.getUserId());
      if (!userOptional.isPresent()) return ResponseEntity.badRequest().body("User not found");
      User user = userOptional.get();
      Waste waste = new Waste();
      waste.setUser(user);
      waste.setType(request.getType());
      waste.setQuantity(request.getQuantity());
      waste.setDescription(request.getDescription());
      waste.setLocationLatitude(request.getLocationLatitude());
      waste.setLocationLongitude(request.getLocationLongitude());
      waste.setLocationAddress(request.getLocationAddress());
      waste.setImageUrl(request.getImageUrl());
      waste.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");
      waste.setCreatedAt(LocalDateTime.now());
      waste.setUpdatedAt(LocalDateTime.now());
      Waste savedWaste = wasteRepository.save(waste);
      return ResponseEntity.ok(savedWaste);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body("Error creating waste entry: " + e.getMessage());
    }
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<?> updateWasteStatus(@PathVariable Long id, @RequestBody Map<String,String> body, @RequestParam(required=false) Long currentUserId) {
    String newStatus = body.get("status");
    String collectorNotes = body.get("collectorNotes");
    String collectionPhotoUrl = body.get("collectionPhotoUrl");
    String collectorLatStr = body.get("collectorLatitude");
    String collectorLngStr = body.get("collectorLongitude");
    if (newStatus==null||newStatus.isBlank()) return ResponseEntity.badRequest().body(Map.of("error","Status is required"));
    if (!List.of("IN_PROGRESS","COLLECTED","PENDING").contains(newStatus)) return ResponseEntity.badRequest().body(Map.of("error","Invalid status"));
    Optional<Waste> wasteOpt = wasteRepository.findById(id);
    if (wasteOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","Waste entry not found"));
    Waste waste = wasteOpt.get();
    User currentUser = null;
    if (currentUserId!=null) {
      Optional<User> userOpt = userRepository.findById(currentUserId);
      if (userOpt.isPresent()) {
        currentUser = userOpt.get();
        if (currentUser.getRole()==Role.DONOR) return ResponseEntity.status(403).body(Map.of("error","Donors cannot update waste status"));
        if (currentUser.getRole()==Role.COLLECTOR) {
          AccountStatus acctStatus = currentUser.getAccountStatus();
          if (acctStatus==null||acctStatus==AccountStatus.PENDING_APPROVAL) return ResponseEntity.status(403).body(Map.of("error","Collector account pending approval","accountStatus","PENDING_APPROVAL"));
          if (acctStatus==AccountStatus.REJECTED) return ResponseEntity.status(403).body(Map.of("error","Collector account rejected","accountStatus","REJECTED"));
        }
      }
    }

    String currentStatus = waste.getStatus();
    if ("IN_PROGRESS".equals(newStatus)) {
      if (!"PENDING".equals(currentStatus)) return ResponseEntity.status(400).body(Map.of("error","Invalid transition","currentStatus",currentStatus));
      if (waste.getCollectedBy()!=null) return ResponseEntity.status(409).body(Map.of("error","Already claimed"));
      waste.setStatus("IN_PROGRESS"); waste.setClaimedAt(LocalDateTime.now()); waste.setUpdatedAt(LocalDateTime.now()); if (currentUser!=null) waste.setCollectedBy(currentUser);
      if (collectorNotes!=null && currentUser!=null && currentUser.getRole()!=Role.DONOR) waste.setCollectorNotes(collectorNotes);
      Waste saved = wasteRepository.save(waste);
      if (saved.getUser()!=null && currentUser!=null) notificationService.notifyDonorPickupClaimed(saved.getUser(), saved.getType(), currentUser.getName());
      return ResponseEntity.ok(saved);
    }

    if ("COLLECTED".equals(newStatus)) {
      if (!"IN_PROGRESS".equals(currentStatus)) return ResponseEntity.status(400).body(Map.of("error","Invalid transition","currentStatus",currentStatus));
      if (waste.getCollectedBy()!=null && currentUserId!=null && !waste.getCollectedBy().getId().equals(currentUserId)) return ResponseEntity.status(403).body(Map.of("error","Only assigned collector can complete"));
      if (waste.getClaimedAt()!=null) {
        long minutesSinceClaim = java.time.Duration.between(waste.getClaimedAt(), LocalDateTime.now()).toMinutes();
        if (minutesSinceClaim<5) return ResponseEntity.status(400).body(Map.of("error","Must wait at least 5 minutes after claiming","minutesRemaining",5-minutesSinceClaim));
      }
      if (collectionPhotoUrl==null||collectionPhotoUrl.isBlank()) return ResponseEntity.status(400).body(Map.of("error","Collection photo required"));
      Double collectorLat=null, collectorLng=null; try { if (collectorLatStr!=null) collectorLat=Double.parseDouble(collectorLatStr); if (collectorLngStr!=null) collectorLng=Double.parseDouble(collectorLngStr);} catch(NumberFormatException e){return ResponseEntity.badRequest().body(Map.of("error","Invalid GPS format","code","INVALID_GPS_FORMAT"));}
      if (collectorLat==null||collectorLng==null) return ResponseEntity.status(400).body(Map.of("error","GPS required","code","GPS_REQUIRED"));
      double pickupLat = waste.getLocationLatitude(); double pickupLng = waste.getLocationLongitude(); if (pickupLat!=0 && pickupLng!=0) {
        double distanceMeters = haversineDistance(collectorLat, collectorLng, pickupLat, pickupLng);
        if (distanceMeters>200) return ResponseEntity.status(400).body(Map.of("error","Too far from pickup","code","TOO_FAR_FROM_PICKUP","distanceMeters",Math.round(distanceMeters),"maxDistanceMeters",200));
      }
      waste.setStatus("COLLECTED"); waste.setUpdatedAt(LocalDateTime.now()); waste.setCollectionPhotoUrl(collectionPhotoUrl); waste.setCollectorLatitude(collectorLat); waste.setCollectorLongitude(collectorLng);
      if (collectorNotes!=null && currentUser!=null && currentUser.getRole()!=Role.DONOR) waste.setCollectorNotes(collectorNotes);
      Waste saved = wasteRepository.save(waste);
      if (saved.getUser()!=null) notificationService.notifyDonorPickupCompleted(saved.getUser(), saved.getType(), currentUser!=null?currentUser.getName():"A collector");
      return ResponseEntity.ok(saved);
    }

    if ("PENDING".equals(newStatus)) {
      waste.setStatus("PENDING"); waste.setCollectedBy(null); waste.setClaimedAt(null); waste.setCollectionPhotoUrl(null); waste.setCollectorLatitude(null); waste.setCollectorLongitude(null); waste.setCollectorNotes(null); waste.setUpdatedAt(LocalDateTime.now());
      Waste saved = wasteRepository.save(waste); return ResponseEntity.ok(saved);
    }

    return ResponseEntity.badRequest().body(Map.of("error","Unhandled status transition"));
  }

  private double haversineDistance(double lat1,double lon1,double lat2,double lon2){ final double R=6371000; double dLat=Math.toRadians(lat2-lat1); double dLon=Math.toRadians(lon2-lon1); double a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2); double c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); return R*c; }
}
```

---

File: backend/src/main/java/com/ecotrack/backend/controller/FileUploadController.java
```java
package com.ecotrack.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

  private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg","image/jpg","image/png","image/gif","image/webp","image/bmp");
  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static final String UPLOAD_DIR = "uploads/waste-photos/";

  @PostMapping("/waste-image")
  public ResponseEntity<?> uploadWasteImage(@RequestParam("file") MultipartFile file) {
    try {
      if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","No file provided"));
      if (file.getSize() > MAX_FILE_SIZE) return ResponseEntity.badRequest().body(Map.of("error","File size exceeds 10MB"));
      String contentType = file.getContentType(); if (contentType==null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) return ResponseEntity.badRequest().body(Map.of("error","Invalid file type"));
      String originalFilename = file.getOriginalFilename(); if (originalFilename==null || !isValidImageExtension(originalFilename)) return ResponseEntity.badRequest().body(Map.of("error","Invalid file extension"));
      Path uploadPath = Paths.get(UPLOAD_DIR); if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
      String fileExtension = getFileExtension(originalFilename); String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension; Path filePath = uploadPath.resolve(uniqueFilename);
      Files.copy(file.getInputStream(), filePath);
      return ResponseEntity.ok(Map.of("message","File uploaded successfully","filename",uniqueFilename,"url","/api/upload/files/"+uniqueFilename,"size",file.getSize(),"contentType",contentType));
    } catch (IOException e) {
      return ResponseEntity.status(500).body(Map.of("error","Failed to upload file: " + e.getMessage()));
    }
  }

  private boolean isValidImageExtension(String filename) { String extension = getFileExtension(filename).toLowerCase(); return Arrays.asList("jpg","jpeg","png","gif","webp","bmp").contains(extension); }
  private String getFileExtension(String filename){ int lastDotIndex = filename.lastIndexOf('.'); return (lastDotIndex>0)?filename.substring(lastDotIndex+1):""; }
}
```

---

File: backend/src/main/java/com/ecotrack/backend/service/WastePriorityService.java
```java
package com.ecotrack.backend.service;

import org.springframework.stereotype.Service;

@Service
public class WastePriorityService {

  public double calculatePriority(String wasteType, double quantity, int daysSincePosted, double distanceKm) {
    double weightFactor;
    switch (wasteType.toUpperCase()) {
      case "FOOD":    weightFactor = 2.0; break;
      case "E-WASTE": weightFactor = 1.8; break;
      case "PLASTIC": weightFactor = 1.2; break;
      case "PAPER":   weightFactor = 1.0; break;
      case "ORGANIC": weightFactor = 1.6; break;
      default:        weightFactor = 1.5;
    }
    double urgencyFactor = daysSincePosted * 1.2;
    double distancePenalty = distanceKm * 0.5;
    return (quantity * weightFactor) + urgencyFactor - distancePenalty;
  }
}
```

---

File: backend/src/main/java/com/ecotrack/backend/model/Waste.java (entity excerpt)
```java
package com.ecotrack.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste")
public class Waste {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne @JoinColumn(name = "user_id", nullable = false) private User user;
  @Column(nullable = false) private String type;
  @Column(nullable = false) private double quantity;
  @Column(nullable = false) private String description;
  @Column(name = "location_latitude") private double locationLatitude;
  @Column(name = "location_longitude") private double locationLongitude;
  @Column(name = "location_address") private String locationAddress;
  @Column(name = "image_url") private String imageUrl;
  @Column private String status;
  @ManyToOne @JoinColumn(name = "collected_by_id") private User collectedBy;
  @Column(name = "claimed_at") private LocalDateTime claimedAt;
  @Column(name = "collection_photo_url") private String collectionPhotoUrl;
  @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
  @Column(name = "updated_at") private LocalDateTime updatedAt = LocalDateTime.now();
  // getters/setters omitted for brevity
}
```

---

## FRONTEND CODE

### Aggregated Frontend Excerpts (~200 lines)

Includes the API service and key screen logic used by the app (image upload, AI classification, camera capture, geolocation, status updates).

File: src/app/services/apiService.ts
```ts
// API Service for EcoTrack Backend
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api';

export class ApiError extends Error { status: number; data: any; constructor(status: number, data: any, message: string){ super(message); this.status=status; this.data=data; } }

function friendlyMessage(status:number,data:any):string{ if (data?.error) return data.error; if (status===403) return 'You are not authorized to perform this action.'; if (status===409) return 'This resource has already been modified by someone else.'; if (status===404) return 'The requested resource was not found.'; if (status===400) return 'Invalid request. Please check your input.'; if (status>=500) return 'Server error. Please try again later.'; return `Unexpected error (${status})`; }

const apiCall = async (endpoint:string, method:string='GET', data?:any, silent:boolean=false)=>{
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  const token = localStorage.getItem('token'); if (token) headers['Authorization'] = `Bearer ${token}`;
  const options: RequestInit = { method, headers }; if (data) options.body = JSON.stringify(data);
  try {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    if (response.status===401 && localStorage.getItem('token')) { localStorage.clear(); setTimeout(()=>{window.location.href='/';},50); throw new ApiError(401,null,'Session expired. Please log in again.'); }
    if (response.status===403 && !localStorage.getItem('token')) { window.location.href='/'; throw new ApiError(403,null,'Please log in to continue.'); }
    let errorData:any=null; try{ const text = await response.text(); if (text) { try{errorData=JSON.parse(text);}catch{errorData={error:text};}} }catch{}
    const msg = friendlyMessage(response.status,errorData); const apiError = new ApiError(response.status,errorData,msg);
    if (!silent) { if (response.status===403) toast.error(msg,{id:`err-403-${endpoint}`}); else if (response.status===409) toast.error(msg,{id:`err-409-${endpoint}`}); else if (response.status>=500) toast.error(msg,{id:`err-500-${endpoint}`}); }
    throw apiError;
  }
  const contentType = response.headers.get('content-type'); if (contentType && contentType.includes('application/json')) return await response.json(); return await response.text();
  } catch (error) { if (error instanceof ApiError) throw error; console.error('API call failed:',error); toast.error('Unable to reach server. Check your connection.',{id:'network-error'}); throw error; }
};

export const wasteAPI = { getAllWaste:()=>apiCall('/waste'), getWasteByUserId:(userId:number)=>apiCall(`/waste/user/${userId}`), createWaste:(wasteData:any)=>apiCall('/waste','POST',wasteData), updateWasteStatus:(id:number,status:string,currentUserId?:number,collectorNotes?:string,extras?:any)=>{ const body:any={status}; if (collectorNotes) body.collectorNotes=collectorNotes; if (extras?.collectionPhotoUrl) body.collectionPhotoUrl=extras.collectionPhotoUrl; if (extras?.collectorLatitude!=null) body.collectorLatitude=String(extras.collectorLatitude); if (extras?.collectorLongitude!=null) body.collectorLongitude=String(extras.collectorLongitude); return apiCall(`/waste/${id}/status${currentUserId?`?currentUserId=${currentUserId}`:''}`,'PATCH',body); }, classifyImage:(userId:number,imageBase64:string)=>apiCall('/waste/classify','POST',{userId,imageBase64},true) };

export const uploadAPI = { uploadWasteImage: async (file:File):Promise<{url:string;filename:string}>=>{ const formData=new FormData(); formData.append('file',file); const headers:Record<string,string>={}; const token=localStorage.getItem('token'); if(token) headers['Authorization']=`Bearer ${token}`; const res=await fetch(`${API_BASE_URL}/upload/waste-image`,{method:'POST',body:formData,headers}); if(!res.ok){ const data=await res.json().catch(()=>({})); throw new ApiError(res.status,data,data.error||'Upload failed'); } return res.json(); } };
```

---

File: src/app/screens/TrackWasteScreen.tsx (key excerpts)
```tsx
// Tracks waste submission: camera capture, AI classification, geocoding and submission flow
import { useState, useEffect, useRef, useMemo } from "react";
import { wasteAPI, wastePriorityAPI, pickupAPI, facilityAPI } from "../services/apiService";
import toast from "react-hot-toast";

export function TrackWasteScreen(){
  const [photoPreview,setPhotoPreview]=useState<string|null>(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState<any|null>(null);
  const [formData,setFormData]=useState({ type:'E-WASTE', description:'', quantity:'', locationLatitude:11.0168, locationLongitude:76.9558, locationAddress:'', time:'09:00' });

  const analyseWithAI = async (base64:string)=>{ const userId = localStorage.getItem('userId'); if(!userId) return; setAiLoading(true); setAiResult(null); try{ const result = await wasteAPI.classifyImage(parseInt(userId), base64); setAiResult(result); } catch(err){ setAiResult(null); setAiLoading(false); return; } finally{ setAiLoading(false);} };

  const handleSubmit=async(e:React.FormEvent)=>{ e.preventDefault(); try{ const quantity=parseFloat(formData.quantity); if (!formData.description.trim()||isNaN(quantity)||quantity<=0){ toast.error('Validation failed'); return; } const wasteData={ userId:parseInt(localStorage.getItem('userId')||'1'), type:formData.type, quantity, description:formData.description.trim(), locationLatitude:formData.locationLatitude, locationLongitude:formData.locationLongitude, locationAddress:formData.locationAddress.trim(), time:formData.time, status:'PENDING' }; await wasteAPI.createWaste(wasteData); toast.success('Waste entry saved'); // fetch priority/schedule/facility
  const [prio,sched,fac]=await Promise.all([ wastePriorityAPI.calculatePriority(wasteData.type,wasteData.quantity,0,0).catch(()=>null), pickupAPI.schedulePickup(wasteData.type,wasteData.quantity,0,5).catch(()=>null), facilityAPI.getNearestFacility(wasteData.type,wasteData.locationLatitude,wasteData.locationLongitude).catch(()=>null) ]);
  }catch(err){ toast.error('Failed to save waste entry'); console.error(err);} };

  const handlePhotoCapture=(e:React.ChangeEvent<HTMLInputElement>)=>{ const file = e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onloadend=()=>{ const base64 = reader.result as string; setPhotoPreview(base64); analyseWithAI(base64); e.target.value=''; }; reader.readAsDataURL(file); };
}
```

---

File: src/app/screens/CollectorPickupsScreen.tsx (key excerpts)
```tsx
// Collector UI: loads pending pickups, computes priority, claims and completes pickups with photo+GPS
import { useState, useEffect, useRef } from "react";
import { wasteAPI, wastePriorityAPI, pickupAPI, facilityAPI, uploadAPI } from "../services/apiService";
import toast from "react-hot-toast";

export function CollectorPickupsScreen(){
  const [allWaste,setAllWaste]=useState<any[]>([]);
  const [priorityData,setPriorityData]=useState<Record<number,any>>({});
  useEffect(()=>{ loadAllWaste(); },[]);
  const loadAllWaste = async ()=>{ try{ const [pending,inProgress,collected] = await Promise.all([ wasteAPI.getWasteByStatus('PENDING').catch(()=>[]), wasteAPI.getWasteByStatus('IN_PROGRESS').catch(()=>[]), wasteAPI.getWasteByStatus('COLLECTED').catch(()=>[]) ]); const all=[...pending,...inProgress,...collected]; setAllWaste(all); await loadAlgorithmData(all.filter(w=>w.status!=='COLLECTED')); }catch(err){ console.error(err);} };

  const loadAlgorithmData = async (entries:any[])=>{ const priorities:Record<number,any>={}; await Promise.all(entries.map(async(entry)=>{ const daysOld = Math.floor((Date.now()-new Date(entry.createdAt).getTime())/86400000); const lat = entry.locationLatitude||11.0168; const lng = entry.locationLongitude||76.9558; const dist = haversineDistance(11.0168,76.9558,lat,lng); try{ const prio = await wastePriorityAPI.calculatePriority(entry.type,entry.quantity,daysOld,dist).catch(()=>null); if(prio) priorities[entry.id]=prio; }catch{} })); setPriorityData(priorities); };

  const handleStatusUpdate = async (wasteId:number,newStatus:string)=>{ try{ if(newStatus==='COLLECTED'){ /* open dialog for photo + GPS then call uploadAPI.uploadWasteImage and wasteAPI.updateWasteStatus */ } else { await wasteAPI.updateWasteStatus(wasteId,newStatus,parseInt(localStorage.getItem('userId')||'0')); toast.success('Status updated'); loadAllWaste(); } }catch(err){ toast.error('Failed to update status'); console.error(err);} };

  const haversineDistance = (lat1:number,lon1:number,lat2:number,lon2:number)=>{ const R=6371; const dLat=((lat2-lat1)*Math.PI)/180; const dLon=((lon2-lon1)*Math.PI)/180; const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)*Math.sin(dLon/2); return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); };
}
```

