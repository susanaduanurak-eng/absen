import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  MapPin, 
  LogOut, 
  LogIn, 
  History, 
  User, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  FileText,
  ShieldCheck,
  Camera,
  Upload,
  Plus,
  Search,
  Download,
  Bell,
  MoreHorizontal,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DigitalClock from './components/DigitalClock';
import DateDisplay from './components/DateDisplay';

// Lazy load Map components
const MapContainer = React.lazy(() => import('react-leaflet').then(m => ({ default: m.MapContainer })));
const TileLayer = React.lazy(() => import('react-leaflet').then(m => ({ default: m.TileLayer })));
const Marker = React.lazy(() => import('react-leaflet').then(m => ({ default: m.Marker })));
const Circle = React.lazy(() => import('react-leaflet').then(m => ({ default: m.Circle })));
const Popup = React.lazy(() => import('react-leaflet').then(m => ({ default: m.Popup })));
const useMap = () => {
  const [map, setMap] = useState<any>(null);
  // This is a simplified version since we can't easily lazy load hooks
  // But we'll handle it inside the components
  return map;
};

// We'll need a wrapper for Leaflet because of the global L
let L: any = null;
const loadLeaflet = async () => {
  if (L) return L;
  L = (await import('leaflet')).default;
  // Fix for default marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  return L;
};

function MapUpdater({ center }: { center: [number, number] }) {
  // Dynamic import of useMap
  const [map, setMap] = useState<any>(null);
  
  useEffect(() => {
    import('react-leaflet').then(m => {
      // We can't easily use the hook here if it's not in a component under MapContainer
      // So we'll pass the map instance differently or use a different approach
    });
  }, []);

  return null;
}

const RealtimeMap = React.memo(({ center, zoom = 16, children, showLiveLabel = true, interactive = true }: { center: [number, number], zoom?: number, children?: React.ReactNode, showLiveLabel?: boolean, interactive?: boolean }) => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    loadLeaflet().then(() => setLeafletLoaded(true));
  }, []);

  if (!leafletLoaded) return <div className="w-full h-full bg-zinc-100 animate-pulse flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Memuat Peta...</div>;

  return (
    <div className="w-full h-full relative z-10 bg-zinc-100">
      <React.Suspense fallback={<div className="w-full h-full bg-zinc-100 animate-pulse" />}>
        <MapContainer 
          center={center} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          preferCanvas={true}
          dragging={interactive}
          touchZoom={interactive}
          scrollWheelZoom={interactive}
          doubleClickZoom={interactive}
          boxZoom={false}
          keyboard={false}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
            updateWhenIdle={true}
            updateWhenZooming={false}
            keepBuffer={2}
          />
          <Marker position={center} />
          {children}
        </MapContainer>
      </React.Suspense>
      {showLiveLabel && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100 shadow-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Live Tracking
        </div>
      )}
    </div>
  );
});

function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
  }, [map, onMapClick]);
  return null;
}

// Types
interface UserData {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'guru' | 'pegawai';
  nip?: string;
}

interface AttendanceRecord {
  id: number;
  type: 'in' | 'out';
  timestamp: string;
  latitude: number;
  longitude: number;
  address: string;
  selfie?: string;
}

interface Stats {
  totalUsers: number;
  todayAttendance: number;
  pendingPermissions: number;
}

type Tab = 'beranda' | 'absensi' | 'jurnal' | 'izin' | 'admin';

const formatDate = (date: any) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toISOString().split('T')[0];
  } catch (e) {
    return "Invalid Date";
  }
};

const formatTime = (date: any) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Time";
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return "Invalid Time";
  }
};

const AdminPanel = React.lazy(() => import('./components/AdminPanel'));

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('beranda');
  const [history, setHistory] = useState<Tab[]>(['beranda']);

  // Handle Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    // Initial state
    window.history.replaceState({ tab: 'beranda' }, '');
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeTab = (tab: Tab) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '');
      setActiveTab(tab);
    }
  };
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, todayAttendance: 0, pendingPermissions: 0 });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinArea, setIsWithinArea] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Attendance Wizard State
  const [attendanceStep, setAttendanceStep] = useState(1);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out' | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Journal form state
  const [journalClass, setJournalClass] = useState('');
  const [journalSubject, setJournalSubject] = useState('');
  const [journalTeachingHours, setJournalTeachingHours] = useState<string[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalSelfie, setJournalSelfie] = useState<string | null>(null);
  const [showJournalCamera, setShowJournalCamera] = useState(false);
  const journalVideoRef = useRef<HTMLVideoElement>(null);

  // Permission form state
  const [permissionType, setPermissionType] = useState<'sakit' | 'izin'>('sakit');
  const [permissionReason, setPermissionReason] = useState('');
  const [permissionFile, setPermissionFile] = useState<string | null>(null);

  // Admin management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminClasses, setAdminClasses] = useState<any[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);
  const [adminGeos, setAdminGeos] = useState<any[]>([]);
  const [adminAttendance, setAdminAttendance] = useState<any[]>([]);
  const [adminJournals, setAdminJournals] = useState<any[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState('Ringkasan');
  const [userHistory, setUserHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchGeolocations();
      fetchUserHistory();
      fetchStats();
      fetchPublicData();
    }
  }, [user]);

  const fetchPublicData = async () => {
    try {
      const [c, s] = await Promise.all([
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
      ]);
      setAdminClasses(Array.isArray(c) ? c : []);
      setAdminSubjects(Array.isArray(s) ? s : []);
    } catch (err) {
      console.error("Failed to fetch public data", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {}
  };

  const fetchUserHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/attendance/history/${user.id}`);
      const data = await res.json();
      setUserHistory(data);
    } catch (err) {}
  };

  const fetchGeolocations = async () => {
    try {
      const res = await fetch('/api/geolocations');
      const data = await res.json();
      setAdminGeos(data);
    } catch (err) {
      console.error("Failed to fetch geolocations", err);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'admin' && user.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, adminTab]);

  const fetchAdminData = async () => {
    try {
      const [u, c, s, g, a, j, p] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/classes').then(r => r.json()),
        fetch('/api/admin/subjects').then(r => r.json()),
        fetch('/api/geolocations').then(r => r.json()),
        fetch('/api/admin/attendance').then(r => r.json()),
        fetch('/api/admin/journals').then(r => r.json()),
        fetch('/api/admin/permissions').then(r => r.json()),
      ]);
      setAdminUsers(Array.isArray(u) ? u : []);
      setAdminClasses(Array.isArray(c) ? c : []);
      setAdminSubjects(Array.isArray(s) ? s : []);
      setAdminGeos(Array.isArray(g) ? g : []);
      setAdminAttendance(Array.isArray(a) ? a : []);
      setAdminJournals(Array.isArray(j) ? j : []);
      setAdminPermissions(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJournalSubmit = async () => {
    if (!user || !journalClass || !journalSubject || !journalContent) {
      setMessage({ text: "Lengkapi semua data jurnal", type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          classId: journalClass,
          subjectId: journalSubject,
          teachingHours: journalTeachingHours.join(','),
          content: journalContent,
          selfie: journalSelfie,
          latitude: location?.lat,
          longitude: location?.lng
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Jurnal berhasil disimpan!", type: 'success' });
        setJournalContent('');
        setJournalSelfie(null);
        changeTab('beranda');
      }
    } catch (err) {
      setMessage({ text: "Gagal menyimpan jurnal", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionSubmit = async () => {
    if (!user || !permissionReason) {
      setMessage({ text: "Berikan alasan izin", type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: permissionType,
          reason: permissionReason,
          fileUrl: permissionFile
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Pengajuan izin berhasil dikirim!", type: 'success' });
        setPermissionReason('');
        setPermissionFile(null);
        changeTab('beranda');
      }
    } catch (err) {
      setMessage({ text: "Gagal mengirim izin", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPermissionFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'guru' | 'pegawai'>('pegawai');
  const [newUserNip, setNewUserNip] = useState('');

  // Admin settings state
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newGeoName, setNewGeoName] = useState('');
  const [newGeoLat, setNewGeoLat] = useState('');
  const [newGeoLng, setNewGeoLng] = useState('');
  const [newGeoRadius, setNewGeoRadius] = useState('100');
  const [addressSearch, setAddressSearch] = useState('');
  const [geoSearchResults, setGeoSearchResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;
    setIsSearchingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&limit=5`);
      const data = await res.json();
      setGeoSearchResults(data);
      if (data.length === 0) {
        setMessage({ text: "Alamat tidak ditemukan", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Gagal mencari alamat", type: 'error' });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole,
          nip: newUserNip
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: editingUser ? "User berhasil diperbarui!" : "User berhasil ditambahkan!", type: 'success' });
        setShowAddUser(false);
        setEditingUser(null);
        fetchAdminData();
        // Reset form
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserNip('');
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: editingUser ? "Gagal memperbarui user" : "Gagal menambahkan user", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) {
        setMessage({ text: "User berhasil dihapus", type: 'success' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ text: "Gagal menghapus user", type: 'error' });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName })
      });
      if ((await res.json()).success) {
        setMessage({ text: "Kelas berhasil ditambahkan", type: 'success' });
        setNewClassName('');
        fetchAdminData();
        fetchPublicData();
      }
    } catch (err) {
      setMessage({ text: "Gagal menambahkan kelas", type: 'error' });
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName })
      });
      if ((await res.json()).success) {
        setMessage({ text: "Mata pelajaran berhasil ditambahkan", type: 'success' });
        setNewSubjectName('');
        fetchAdminData();
        fetchPublicData();
      }
    } catch (err) {
      setMessage({ text: "Gagal menambahkan mata pelajaran", type: 'error' });
    }
  };

  const handleAddGeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/geolocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newGeoName, 
          latitude: parseFloat(newGeoLat), 
          longitude: parseFloat(newGeoLng), 
          radius: parseInt(newGeoRadius) 
        })
      });
      if ((await res.json()).success) {
        setMessage({ text: "Lokasi sekolah berhasil diperbarui!", type: 'success' });
        setNewGeoName('');
        setNewGeoLat('');
        setNewGeoLng('');
        setAddressSearch('');
        setGeoSearchResults([]);
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ text: "Gagal menambahkan geolokasi", type: 'error' });
    }
  };

  const exportToExcel = async () => {
    if (!Array.isArray(adminAttendance) || adminAttendance.length === 0) {
      setMessage({ text: "Tidak ada data untuk diekspor", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const data = adminAttendance.map(a => ({
        'Nama Pegawai': a?.user_name || 'N/A',
        'Tipe': a?.type === 'in' ? 'Masuk' : 'Pulang',
        'Waktu': a?.timestamp ? new Date(a.timestamp).toLocaleString('id-ID') : 'N/A',
        'Alamat/Koordinat': a?.address || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
      XLSX.writeFile(wb, `Laporan_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
      setMessage({ text: "Data berhasil diekspor ke Excel!", type: 'success' });
    } catch (err) {
      setMessage({ text: "Gagal mengekspor data", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const stopStream = (videoElement: HTMLVideoElement | null) => {
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      videoElement.srcObject = null;
    }
  };

  const startJournalCamera = async () => {
    stopStream(journalVideoRef.current);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    setShowJournalCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (journalVideoRef.current) {
        journalVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Journal Camera error:", err);
      setMessage({ text: "Gagal mengakses kamera. Pastikan izin kamera diberikan.", type: 'error' });
      setShowJournalCamera(false);
    }
  };

  useEffect(() => {
    if (showJournalCamera) {
      startJournalCamera();
    } else {
      stopStream(journalVideoRef.current);
    }
    return () => stopStream(journalVideoRef.current);
  }, [showJournalCamera]);

  useEffect(() => {
    if (attendanceStep === 3 && !capturedSelfie) {
      startCamera();
    } else {
      stopStream(videoRef.current);
    }
    return () => stopStream(videoRef.current);
  }, [attendanceStep, capturedSelfie]);

  const takeJournalPhoto = () => {
    if (journalVideoRef.current) {
      const canvas = document.createElement('canvas');
      // Resize for mobile efficiency
      const maxDim = 800;
      let width = journalVideoRef.current.videoWidth;
      let height = journalVideoRef.current.videoHeight;
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(journalVideoRef.current, 0, 0, width, height);
        setJournalSelfie(canvas.toDataURL('image/jpeg', 0.6));
        
        // Stop camera
        const stream = journalVideoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setShowJournalCamera(false);
      }
    }
  };

  const refreshLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLoc);
          checkProximity(newLoc);
          setLoading(false);
          setMessage({ text: "Lokasi berhasil diperbarui!", type: 'success' });
        },
        (err) => {
          console.error("Location error:", err);
          setLoading(false);
          setMessage({ text: "Gagal mendapatkan lokasi GPS. Pastikan GPS aktif.", type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setMessage({ text: "Browser Anda tidak mendukung GPS", type: 'error' });
    }
  };

  useEffect(() => {
    let watcher: number | null = null;
    if (user) {
      fetchStats();
      
      if (navigator.geolocation) {
        watcher = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(newLoc);
            checkProximity(newLoc);
          },
          (err) => console.error("Location error:", err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }
    return () => {
      if (watcher !== null) navigator.geolocation.clearWatch(watcher);
    };
  }, [user, adminGeos]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const checkProximity = (loc: { lat: number; lng: number }) => {
    if (adminGeos.length > 0) {
      let minDistance = Infinity;
      let within = false;
      
      adminGeos.forEach(geo => {
        const d = calculateDistance(loc.lat, loc.lng, geo.latitude, geo.longitude);
        if (d < minDistance) minDistance = d;
        if (d <= geo.radius) within = true;
      });
      
      setDistance(minDistance);
      setIsWithinArea(within);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Gagal terhubung ke server", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    stopStream(videoRef.current);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          aspectRatio: { ideal: 3/4 },
          width: { ideal: 720 },
          height: { ideal: 960 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Attendance Camera error:", err);
      setMessage({ text: "Gagal mengakses kamera. Pastikan izin kamera diberikan.", type: 'error' });
    }
  };

  const takeSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Resize for mobile efficiency
      const maxDim = 800;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        
        // Watermark - adjust font size for smaller canvas
        ctx.fillStyle = "white";
        ctx.font = "14px sans-serif";
        const dateStr = new Date().toLocaleString('id-ID');
        const locStr = location ? `${location?.lat?.toFixed(4) || '0'}, ${location?.lng?.toFixed(4) || '0'}` : "Unknown Location";
        ctx.fillText(dateStr, 15, canvas.height - 35);
        ctx.fillText(locStr, 15, canvas.height - 15);
        
        setCapturedSelfie(canvas.toDataURL('image/jpeg', 0.6));
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const submitAttendance = async () => {
    if (!user || !attendanceType || !capturedSelfie || !location) return;
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: attendanceType,
          latitude: location.lat,
          longitude: location.lng,
          address: `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`,
          selfie: capturedSelfie
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Absensi berhasil dikirim!", type: 'success' });
        setAttendanceStep(1);
        setAttendanceType(null);
        setCapturedSelfie(null);
        changeTab('beranda');
        fetchStats();
        fetchUserHistory();
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Gagal mengirim absensi", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-zinc-200/50 p-10 border border-zinc-100"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
              <ShieldCheck className="text-white w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">ABSENSI & JURNAL SMKN 1 POCO RANAKA</h1>
            <p className="text-zinc-500 text-sm mt-1">Sistem Informasi Kehadiran Terpadu</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Username / NIP</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
              >
                <AlertCircle className="w-5 h-5" />
                {message.text}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Masuk Sekarang"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 md:pb-32">
      {/* Top Header */}
      <header className="bg-white px-4 md:px-8 py-4 md:py-5 flex justify-between items-center sticky top-0 z-30 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center md:hidden">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-blue-600 tracking-tight truncate max-w-[150px] sm:max-w-none">SMKN 1 POCO RANAKA</h1>
        </div>
        <div className="flex items-center gap-1 md:gap-4">
          <button 
            onClick={() => {
              fetchStats();
              fetchUserHistory();
              fetchPublicData();
              refreshLocation();
            }}
            className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-full transition-colors active:rotate-180 duration-500"
          >
            <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-zinc-500 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8">
        
        {activeTab === 'beranda' && (
          <div className="space-y-8">
            {/* Hero Card */}
            <section className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-zinc-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900">Halo, {user.name}!</h2>
                <DateDisplay />
                <div className="mt-4">
                  {Array.isArray(userHistory) && userHistory.some(h => {
                    const recordDate = formatDate(h?.timestamp);
                    const today = new Date(new Date().getTime() + 8 * 3600000).toISOString().split('T')[0];
                    return recordDate === today && h?.type === 'in';
                  }) ? (
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                      Sudah Absen Masuk
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100">
                      Belum Absen
                    </span>
                  )}
                </div>
              </div>
              <DigitalClock />
            </section>

            {/* Real-time Proximity Card */}
            <section className={`rounded-[24px] md:rounded-[32px] p-4 md:p-6 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
              isWithinArea ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              <div className="flex items-center gap-4 md:gap-5 w-full sm:w-auto">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                  isWithinArea ? 'bg-white text-emerald-500' : 'bg-white text-amber-500'
                }`}>
                  <MapPin className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm md:text-base">{isWithinArea ? 'Dalam Area Sekolah' : 'Luar Area Sekolah'}</h4>
                  <p className="text-[10px] md:text-xs font-medium opacity-80">
                    {distance !== null 
                      ? `Jarak: ${Math.round(distance)}m dari titik presensi.` 
                      : 'Mendeteksi lokasi...'}
                  </p>
                </div>
              </div>
              <div className={`w-full sm:w-auto text-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                isWithinArea ? 'bg-emerald-100 border-emerald-200' : 'bg-amber-100 border-amber-200'
              }`}>
                {isWithinArea ? 'SIAP ABSEN' : 'BELUM SIAP'}
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {[
                { label: 'Total Hadir', val: stats.todayAttendance, icon: CheckCircle2, color: 'emerald' },
                { label: 'Jurnal Terisi', val: 0, icon: BookOpen, color: 'blue' },
                { label: 'Izin Disetujui', val: 0, icon: FileText, color: 'purple' },
                { label: 'Ketepatan Waktu', val: '94%', icon: Clock, color: 'indigo' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-zinc-100 shadow-sm space-y-3 md:space-y-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-${s.color}-50 rounded-xl md:rounded-2xl flex items-center justify-center text-${s.color}-600`}>
                    <s.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">{s.label}</p>
                    <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter">{s.val}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Warning Card */}
            <section className="bg-red-50 border border-red-100 rounded-[24px] md:rounded-[32px] p-4 md:p-6 flex items-center justify-between group cursor-pointer hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                  <Clock className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-900 text-sm md:text-base">Peringatan: Terlambat</h4>
                  <p className="text-zinc-500 text-[10px] md:text-xs font-medium">Batas absen pukul 08:30. Segera lakukan presensi!</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-zinc-300 group-hover:text-red-500 transition-colors" />
            </section>

            {/* History Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-zinc-900">Riwayat Terakhir</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
              </div>
              <div className="space-y-4">
                {userHistory.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 text-center border border-zinc-100">
                    <History className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold text-sm">Belum ada riwayat absensi</p>
                  </div>
                ) : (
                  Array.isArray(userHistory) && userHistory.map(record => (
                    <div key={record?.id} className="bg-white p-5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        record?.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {record?.type === 'in' ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-zinc-900">Absen {record?.type === 'in' ? 'Masuk' : 'Pulang'}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {formatDate(record?.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-zinc-900">
                          {formatTime(record?.timestamp)}
                        </p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">WITA</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'absensi' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Step Indicator */}
            <div className="flex justify-between items-center px-10 relative">
              <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-zinc-100 -translate-y-1/2 z-0"></div>
              {[1, 2, 3].map(s => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    attendanceStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-zinc-300 border-2 border-zinc-100'
                  }`}>
                    {s}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {s === 1 ? 'Pilih' : s === 2 ? 'Lokasi' : 'Selfie'}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-xl shadow-zinc-200/50 min-h-[400px] flex flex-col items-center justify-center text-center">
              {attendanceStep === 1 && (
                <div className="w-full space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Presensi Harian</h2>
                    <p className="text-zinc-500 font-medium mt-2">Ketuk salah satu sesi di bawah ini</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: 'in', label: 'Masuk Kerja', sub: 'SESI PAGI', icon: LogIn, color: 'blue' },
                      { id: 'out', label: 'Pulang Kerja', sub: 'SESI SORE', icon: LogOut, color: 'indigo' },
                    ].map(session => (
                      <button 
                        key={session.id}
                        onClick={() => { setAttendanceType(session.id as 'in' | 'out'); setAttendanceStep(2); }}
                        className="w-full p-6 rounded-3xl border border-zinc-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 bg-${session.color}-50 rounded-2xl flex items-center justify-center text-${session.color}-600 group-hover:bg-${session.color}-600 group-hover:text-white transition-colors`}>
                            <session.icon className="w-7 h-7" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-extrabold text-zinc-900 text-lg">{session.label}</h4>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{session.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-zinc-200 group-hover:text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {attendanceStep === 2 && (
                <div className="w-full space-y-8">
                  <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto transition-colors ${
                    isWithinArea ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <MapPin className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900">Verifikasi Lokasi</h2>
                    <p className="text-zinc-500 font-medium mt-2">
                      {isWithinArea ? "Anda berada di area sekolah" : "Anda berada di luar area sekolah"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Jarak ke Sekolah</p>
                      <p className={`text-2xl font-black ${isWithinArea ? 'text-emerald-600' : 'text-red-600'}`}>
                        {distance !== null ? `${Math.round(distance)}m` : "..."}
                      </p>
                    </div>
                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Status Area</p>
                      <p className={`text-sm font-black uppercase tracking-widest ${isWithinArea ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isWithinArea ? "DI DALAM" : "DI LUAR"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 text-left">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">Koordinat Real-time</p>
                    <p className="text-sm font-bold text-zinc-700 font-mono">
                      {location ? `${location?.lat?.toFixed(6) || '0'}, ${location?.lng?.toFixed(6) || '0'}` : "Mencari lokasi..."}
                    </p>
                  </div>

                  {location && (
                    <div className="w-full h-[250px] rounded-3xl overflow-hidden border border-zinc-100 shadow-inner">
                      <RealtimeMap center={[location.lat, location.lng]}>
                        {Array.isArray(adminGeos) && adminGeos.map(geo => (
                          <Circle 
                            key={geo?.id}
                            center={[geo?.latitude || 0, geo?.longitude || 0]}
                            radius={geo?.radius || 100}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                          />
                        ))}
                      </RealtimeMap>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button onClick={() => setAttendanceStep(1)} className="flex-1 py-4 font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Kembali</button>
                    <button 
                      onClick={() => { setAttendanceStep(3); startCamera(); }}
                      disabled={!isWithinArea}
                      className={`flex-[2] font-bold py-4 rounded-2xl shadow-lg transition-all ${
                        isWithinArea 
                        ? 'bg-blue-600 text-white shadow-blue-200 hover:scale-105' 
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      {isWithinArea ? "Lanjut ke Selfie" : "Dekati Area Sekolah"}
                    </button>
                  </div>
                </div>
              )}

              {attendanceStep === 3 && (
                <div className="w-full space-y-8">
                  {!capturedSelfie ? (
                    <>
                      <div className="relative w-full aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover scale-x-[-1]" 
                        />
                        <div className="absolute inset-0 border-2 border-white/20 pointer-events-none"></div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="text-left text-white/80 text-[10px] font-bold uppercase tracking-widest">
                            <p>{new Date().toLocaleDateString('id-ID')}</p>
                            <p>{location?.lat?.toFixed(4) || '0'}, {location?.lng?.toFixed(4) || '0'}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={takeSelfie}
                        className="w-20 h-20 bg-white rounded-full border-8 border-zinc-100 flex items-center justify-center shadow-xl hover:scale-110 transition-transform mx-auto"
                      >
                        <Camera className="w-8 h-8 text-blue-600" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-full aspect-[3/4] bg-zinc-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <img src={capturedSelfie} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setCapturedSelfie(null)} className="flex-1 py-4 font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Ulangi</button>
                        <button 
                          onClick={submitAttendance}
                          disabled={loading}
                          className="flex-[2] bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200"
                        >
                          {loading ? "Mengirim..." : "Kirim Absensi"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jurnal' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Jurnal Mengajar</h2>
            <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm space-y-6">
              {!isWithinArea && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-xs font-bold">Peringatan: Anda berada di luar area sekolah ({Math.round(distance || 0)}m). Jurnal tetap bisa diisi namun lokasi akan tercatat.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Kelas</label>
                  <select 
                    value={journalClass}
                    onChange={(e) => setJournalClass(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Pilih Kelas</option>
                    {Array.isArray(adminClasses) && adminClasses.map(c => <option key={c?.id} value={c?.id}>{c?.name}</option>)}
                    {(!Array.isArray(adminClasses) || adminClasses.length === 0) && (
                      <>
                        <option value="1">X TKJ 1</option>
                        <option value="2">XI RPL 2</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                  <select 
                    value={journalSubject}
                    onChange={(e) => setJournalSubject(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Pilih Mapel</option>
                    {Array.isArray(adminSubjects) && adminSubjects.map(s => <option key={s?.id} value={s?.id}>{s?.name}</option>)}
                    {(!Array.isArray(adminSubjects) || adminSubjects.length === 0) && (
                      <>
                        <option value="1">Pemrograman Web</option>
                        <option value="2">Basis Data</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Jam Mengajar (Bisa pilih lebih dari satu)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        const sh = h.toString();
                        setJournalTeachingHours(prev => 
                          prev.includes(sh) ? prev.filter(x => x !== sh) : [...prev, sh].sort((a,b) => parseInt(a) - parseInt(b))
                        );
                      }}
                      className={`py-3 rounded-xl font-bold text-xs transition-all border ${
                        journalTeachingHours.includes(h.toString())
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Isi Jurnal / Materi</label>
                <textarea 
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[150px]"
                  placeholder="Tuliskan ringkasan materi hari ini..."
                ></textarea>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lokasi Real-time</label>
                  <button 
                    onClick={refreshLocation}
                    className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Lokasi
                  </button>
                </div>
                {location ? (
                  <div className="w-full h-[200px] rounded-3xl overflow-hidden border border-zinc-100 shadow-inner">
                    <RealtimeMap center={[location.lat, location.lng]} zoom={15} />
                  </div>
                ) : (
                  <div className="w-full h-[200px] bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-400 animate-pulse mb-2">Mencari lokasi...</p>
                      <button 
                        onClick={refreshLocation}
                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200"
                      >
                        Aktifkan GPS
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2 ml-1">
                  {location ? `Koordinat: ${location?.lat?.toFixed(6) || '0'}, ${location?.lng?.toFixed(6) || '0'}` : "Menunggu GPS..."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Foto Kegiatan (Selfie)</label>
                <div 
                  onClick={startJournalCamera}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center hover:bg-zinc-50 transition-colors cursor-pointer group ${journalSelfie ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200'}`}
                >
                  {journalSelfie ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-emerald-700">Foto Berhasil Diambil</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-zinc-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-bold text-zinc-400 group-hover:text-zinc-900">Ambil Foto</p>
                    </>
                  )}
                </div>
              </div>
              <button 
                onClick={handleJournalSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Jurnal"}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'izin' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Pengajuan Izin</h2>
            <div className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Jenis Izin</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPermissionType('sakit')}
                    className={`py-4 rounded-2xl border-2 font-bold transition-all ${permissionType === 'sakit' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-zinc-100 text-zinc-400'}`}
                  >
                    Sakit
                  </button>
                  <button 
                    onClick={() => setPermissionType('izin')}
                    className={`py-4 rounded-2xl border-2 font-bold transition-all ${permissionType === 'izin' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-zinc-100 text-zinc-400'}`}
                  >
                    Izin Lainnya
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Alasan / Keterangan</label>
                <textarea 
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
                  placeholder="Berikan alasan pengajuan izin..."
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Lampiran (JPG/PDF)</label>
                <label className={`border-2 border-dashed rounded-3xl p-10 text-center hover:bg-zinc-50 transition-colors cursor-pointer group flex flex-col items-center ${permissionFile ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200'}`}>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                  {permissionFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-emerald-700">File Terpilih</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-zinc-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-bold text-zinc-400 group-hover:text-zinc-900">Pilih File Lampiran</p>
                      <p className="text-[10px] text-zinc-300 font-bold uppercase mt-1">Maksimal 5MB</p>
                    </>
                  )}
                </label>
              </div>
              <button 
                onClick={handlePermissionSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && user.role === 'admin' && (
          <React.Suspense fallback={<div className="p-10 text-center font-black text-zinc-400 uppercase tracking-widest animate-pulse">Memuat Panel Admin...</div>}>
            <AdminPanel 
              adminTab={adminTab}
              setAdminTab={setAdminTab}
              exportToExcel={exportToExcel}
              setShowAddUser={setShowAddUser}
              adminUsers={adminUsers}
              adminAttendance={adminAttendance}
              adminJournals={adminJournals}
              adminPermissions={adminPermissions}
              adminClasses={adminClasses}
              adminSubjects={adminSubjects}
              adminGeos={adminGeos}
              setEditingUser={setEditingUser}
              setNewUserName={setNewUserName}
              setNewUserUsername={setNewUserUsername}
              setNewUserPassword={setNewUserPassword}
              setNewUserRole={setNewUserRole}
              setNewUserNip={setNewUserNip}
              handleDeleteUser={handleDeleteUser}
              formatDate={formatDate}
              formatTime={formatTime}
              handleAddClass={handleAddClass}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              handleAddSubject={handleAddSubject}
              newSubjectName={newSubjectName}
              setNewSubjectName={setNewSubjectName}
              location={location}
              setNewGeoLat={setNewGeoLat}
              setNewGeoLng={setNewGeoLng}
              addressSearch={addressSearch}
              setAddressSearch={setAddressSearch}
              handleAddressSearch={handleAddressSearch}
              isSearchingAddress={isSearchingAddress}
              geoSearchResults={geoSearchResults}
              setGeoSearchResults={setGeoSearchResults}
              setNewGeoName={setNewGeoName}
              newGeoName={newGeoName}
              newGeoLat={newGeoLat}
              newGeoLng={newGeoLng}
              newGeoRadius={newGeoRadius}
              setNewGeoRadius={setNewGeoRadius}
              handleAddGeo={handleAddGeo}
              RealtimeMap={RealtimeMap}
              Circle={Circle}
              Popup={Popup}
              MapEventsHandler={MapEventsHandler}
              setMessage={setMessage}
            />
          </React.Suspense>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-2 py-3 flex justify-around items-center z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        {[
          { id: 'beranda', icon: LayoutDashboard, label: 'Beranda' },
          { id: 'absensi', icon: MapPin, label: 'Absen' },
          { id: 'jurnal', icon: BookOpen, label: 'Jurnal' },
          { id: 'izin', icon: Calendar, label: 'Izin' },
          ...(user.role === 'admin' ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : []),
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => changeTab(item.id as Tab)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all active:scale-90 ${
                active ? 'text-blue-600 bg-blue-50/50' : 'text-zinc-400'
              }`}
            >
              <item.icon className={`w-6 h-6 ${active ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Navigation for Desktop */}
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 bg-white border border-zinc-100 rounded-[40px] p-3 hidden md:flex flex-col gap-4 shadow-2xl shadow-zinc-200/50 z-40">
        {[
          { id: 'beranda', icon: LayoutDashboard, label: 'Beranda' },
          { id: 'absensi', icon: MapPin, label: 'Absensi' },
          { id: 'jurnal', icon: BookOpen, label: 'Jurnal' },
          { id: 'izin', icon: Calendar, label: 'Izin' },
          ...(user.role === 'admin' ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : []),
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => changeTab(item.id as Tab)}
              className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all relative group ${
                active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUser(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-zinc-900">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                <button 
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                    setNewUserName('');
                    setNewUserUsername('');
                    setNewUserPassword('');
                    setNewUserNip('');
                  }} 
                  className="p-2 hover:bg-zinc-50 rounded-full"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Nama Lengkap"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">NIP</label>
                    <input 
                      type="text" 
                      value={newUserNip}
                      onChange={(e) => setNewUserNip(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    type="text" 
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Username untuk login"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder={editingUser ? "Kosongkan jika tidak ingin ganti" : "Password minimal 6 karakter"}
                    required={!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Peran / Role</label>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="pegawai">Pegawai</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan User"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Journal Camera Modal */}
      <AnimatePresence>
        {showJournalCamera && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-zinc-900">Ambil Foto Jurnal</h3>
                  <button 
                    onClick={() => {
                      const stream = journalVideoRef.current?.srcObject as MediaStream;
                      if (stream) stream.getTracks().forEach(track => track.stop());
                      setShowJournalCamera(false);
                    }}
                    className="p-2 hover:bg-zinc-50 rounded-full"
                  >
                    <X className="w-6 h-6 text-zinc-400" />
                  </button>
                </div>
                
                <div className="aspect-[3/4] bg-zinc-900 rounded-[32px] overflow-hidden relative shadow-inner">
                  <video 
                    ref={journalVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="absolute inset-0 border-[16px] border-white/10 pointer-events-none"></div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={takeJournalPhoto}
                    className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                  >
                    <Camera className="w-6 h-6" /> AMBIL FOTO
                  </button>
                  <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Pastikan foto kegiatan terlihat jelas
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-32 left-1/2 z-[60] w-full max-w-md px-6"
          >
            <div className={`p-5 rounded-3xl shadow-2xl flex items-center gap-4 border ${
              message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'
            }`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <p className="font-bold text-sm flex-1">{message.text}</p>
              <button onClick={() => setMessage(null)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
