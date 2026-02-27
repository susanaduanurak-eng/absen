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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
}

const RealtimeMap = React.memo(({ center, zoom = 16, children, showLiveLabel = true, interactive = true }: { center: [number, number], zoom?: number, children?: React.ReactNode, showLiveLabel?: boolean, interactive?: boolean }) => {
  return (
    <div className="w-full h-full relative z-10 bg-zinc-100">
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
        <MapUpdater center={center} />
      </MapContainer>
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
  const [currentTime, setCurrentTime] = useState(new Date());
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
  const [journalContent, setJournalContent] = useState('');
  const [journalSelfie, setJournalSelfie] = useState<string | null>(null);

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
    }
  }, [user]);

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
      setAdminUsers(u);
      setAdminClasses(c);
      setAdminSubjects(s);
      setAdminGeos(g);
      setAdminAttendance(a);
      setAdminJournals(j);
      setAdminPermissions(p);
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
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
        setMessage({ text: "User berhasil ditambahkan!", type: 'success' });
        setShowAddUser(false);
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
      setMessage({ text: "Gagal menambahkan user", type: 'error' });
    } finally {
      setLoading(false);
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
        setMessage({ text: "Geolokasi berhasil ditambahkan", type: 'success' });
        setNewGeoName('');
        setNewGeoLat('');
        setNewGeoLng('');
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ text: "Gagal menambahkan geolokasi", type: 'error' });
    }
  };

  const startJournalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // In a real app, we'd show a modal with the camera
      // For this demo, we'll just capture a frame if the videoRef is available, 
      // but since we're in the Journal tab, we might need a separate video element or modal.
      // Let's just use a simple approach: if we're in the journal tab, we'll show a "Taking Photo" state.
      alert("Kamera aktif. Mengambil foto...");
      // Mocking a photo capture for the journal with a slightly different placeholder
      setJournalSelfie("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setMessage({ text: "Gagal mengakses kamera", type: 'error' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          aspectRatio: { ideal: 3/4 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setMessage({ text: "Gagal mengakses kamera", type: 'error' });
    }
  };

  const takeSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Watermark
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        const dateStr = new Date().toLocaleString('id-ID');
        const locStr = location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Unknown Location";
        ctx.fillText(dateStr, 20, canvas.height - 40);
        ctx.fillText(locStr, 20, canvas.height - 20);
        
        setCapturedSelfie(canvas.toDataURL('image/jpeg'));
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {/* Top Header */}
      <header className="bg-white px-8 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-zinc-100">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">ABSENSI & JURNAL SMKN 1 POCO RANAKA</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-full transition-colors relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-2 px-4 py-2 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
        
        {activeTab === 'beranda' && (
          <div className="space-y-8">
            {/* Hero Card */}
            <section className="bg-white rounded-[40px] p-10 border border-zinc-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-zinc-900">Halo, {user.name}!</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="mt-4">
                  {userHistory.some(h => new Date(h.timestamp).toDateString() === new Date().toDateString() && h.type === 'in') ? (
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
              <div className="text-center md:text-right space-y-1">
                <p className="text-6xl font-black text-blue-600 tracking-tighter">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Waktu Server Aktif</p>
              </div>
            </section>

            {/* Real-time Proximity Card */}
            <section className={`rounded-[32px] p-6 border flex items-center justify-between transition-all ${
              isWithinArea ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                  isWithinArea ? 'bg-white text-emerald-500' : 'bg-white text-amber-500'
                }`}>
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold">{isWithinArea ? 'Dalam Area Sekolah' : 'Luar Area Sekolah'}</h4>
                  <p className="text-xs font-medium opacity-80">
                    {distance !== null 
                      ? `Jarak Anda: ${Math.round(distance)} meter dari titik presensi.` 
                      : 'Mendeteksi lokasi Anda...'}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                isWithinArea ? 'bg-emerald-100 border-emerald-200' : 'bg-amber-100 border-amber-200'
              }`}>
                {isWithinArea ? 'SIAP ABSEN' : 'BELUM SIAP'}
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { label: 'Total Hadir', val: stats.todayAttendance, icon: CheckCircle2, color: 'emerald' },
                { label: 'Jurnal Terisi', val: 0, icon: BookOpen, color: 'blue' },
                { label: 'Izin Disetujui', val: 0, icon: FileText, color: 'purple' },
                { label: 'Ketepatan Waktu', val: '94%', icon: Clock, color: 'indigo' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
                  <div className={`w-12 h-12 bg-${s.color}-50 rounded-2xl flex items-center justify-center text-${s.color}-600`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{s.label}</p>
                    <p className="text-3xl font-black text-zinc-900 tracking-tighter">{s.val}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Warning Card */}
            <section className="bg-red-50 border border-red-100 rounded-[32px] p-6 flex items-center justify-between group cursor-pointer hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-900">Peringatan: Terlambat</h4>
                  <p className="text-zinc-500 text-xs font-medium">Batas absen pukul 08:30. Segera lakukan presensi!</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-zinc-300 group-hover:text-red-500 transition-colors" />
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
                  userHistory.map(record => (
                    <div key={record.id} className="bg-white p-5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        record.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {record.type === 'in' ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-zinc-900">Absen {record.type === 'in' ? 'Masuk' : 'Pulang'}</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {new Date(record.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-zinc-900">
                          {new Date(record.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">WIB</p>
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
                      {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "Mencari lokasi..."}
                    </p>
                  </div>

                  {location && (
                    <div className="w-full h-[250px] rounded-3xl overflow-hidden border border-zinc-100 shadow-inner">
                      <RealtimeMap center={[location.lat, location.lng]}>
                        {adminGeos.map(geo => (
                          <Circle 
                            key={geo.id}
                            center={[geo.latitude, geo.longitude]}
                            radius={geo.radius}
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
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 border-2 border-white/20 pointer-events-none"></div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="text-left text-white/80 text-[10px] font-bold uppercase tracking-widest">
                            <p>{new Date().toLocaleDateString('id-ID')}</p>
                            <p>{location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}</p>
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
                    {adminClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {adminClasses.length === 0 && (
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
                    {adminSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {adminSubjects.length === 0 && (
                      <>
                        <option value="1">Pemrograman Web</option>
                        <option value="2">Basis Data</option>
                      </>
                    )}
                  </select>
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
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Lokasi Real-time</label>
                {location ? (
                  <div className="w-full h-[200px] rounded-3xl overflow-hidden border border-zinc-100 shadow-inner">
                    <RealtimeMap center={[location.lat, location.lng]} zoom={15} />
                  </div>
                ) : (
                  <div className="w-full h-[200px] bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center">
                    <p className="text-xs font-bold text-zinc-400 animate-pulse">Mencari lokasi...</p>
                  </div>
                )}
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2 ml-1">
                  {location ? `Koordinat: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "Menunggu GPS..."}
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
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Manajemen Sistem</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">Panel Administrator</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-100">
                  <Download className="w-4 h-4" /> Export Excel
                </button>
                <button 
                  onClick={() => setShowAddUser(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Plus className="w-4 h-4" /> Tambah User
                </button>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-3xl border border-zinc-100 shadow-sm overflow-x-auto no-scrollbar">
              {['Ringkasan', 'Log Absen', 'Izin', 'Manajemen User', 'Jurnal', 'Pengaturan'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setAdminTab(t)}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${
                    adminTab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {adminTab === 'Ringkasan' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Weekly Trend */}
                <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-zinc-900 flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-blue-500" />
                      Tren Kehadiran Mingguan
                    </h4>
                    <MoreHorizontal className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="h-64 flex items-end justify-between px-4 relative">
                     {[2, 3, 4, 1, 3].map((h, i) => (
                       <div key={i} className="flex flex-col items-center gap-3 w-12 group relative">
                          <div className="absolute -top-10 bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Hadir: {h}
                          </div>
                          <div 
                            className={`w-full rounded-xl transition-all ${i === 2 ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-blue-100 group-hover:bg-blue-200'}`}
                            style={{ height: `${h * 40}px` }}
                          ></div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum'][i]}
                          </span>
                       </div>
                     ))}
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-zinc-900 flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-500" />
                      Distribusi Peran
                    </h4>
                    <MoreHorizontal className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: 'Admin', count: adminUsers.filter(u => u.role === 'admin').length, total: adminUsers.length || 1, color: 'blue' },
                      { label: 'Guru', count: adminUsers.filter(u => u.role === 'guru').length, total: adminUsers.length || 1, color: 'emerald' },
                      { label: 'Pegawai', count: adminUsers.filter(u => u.role === 'pegawai').length, total: adminUsers.length || 1, color: 'orange' },
                    ].map((r, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-zinc-400">{r.label}</span>
                          <span className="text-zinc-900">{r.count} Orang</span>
                        </div>
                        <div className="h-3 bg-zinc-50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${r.color}-500 rounded-full`}
                            style={{ width: `${(r.count / r.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'Manajemen User' && (
              <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nama / NIP</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Peran</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-zinc-900">{u.name}</p>
                          <p className="text-xs text-zinc-400 font-medium">{u.nip || 'NIP Belum Diatur'}</p>
                        </td>
                        <td className="px-8 py-5 font-medium text-zinc-600">{u.username}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            u.role === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            u.role === 'guru' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-orange-50 text-orange-600 border-orange-100'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <button className="text-blue-600 font-bold text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'Log Absen' && (
              <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipe</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Waktu</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {adminAttendance.map(a => (
                      <tr key={a.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-zinc-900">{a.user_name}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            a.type === 'in' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {a.type === 'in' ? 'Masuk' : 'Pulang'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-zinc-500 font-medium">
                          {new Date(a.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="px-8 py-5 text-xs text-zinc-400 truncate max-w-[200px]">{a.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'Jurnal' && (
              <div className="grid gap-6">
                {adminJournals.map(j => (
                  <div key={j.id} className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm flex gap-8">
                    <div className="w-32 h-32 bg-zinc-100 rounded-3xl overflow-hidden flex-shrink-0">
                      {j.selfie ? (
                        <img src={j.selfie} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">Materi: {j.subject_name}</h4>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                            Guru: {j.user_name} | Kelas: {j.class_name}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {new Date(j.timestamp).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-sm leading-relaxed">{j.content}</p>
                      <div className="flex items-center gap-2 text-blue-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Terverifikasi di {j.latitude.toFixed(4)}, {j.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'Izin' && (
              <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipe</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Alasan</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lampiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {adminPermissions.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-zinc-900">{p.user_name}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            p.type === 'sakit' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-zinc-600">{p.reason}</td>
                        <td className="px-8 py-5">
                          {p.file_url ? (
                            <a href={p.file_url} target="_blank" className="text-blue-600 font-bold text-xs hover:underline">Lihat File</a>
                          ) : (
                            <span className="text-zinc-300 text-xs">Tidak ada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'Pengaturan' && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Manage Classes */}
                <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm space-y-6">
                  <h4 className="text-xl font-black text-zinc-900">Manajemen Kelas</h4>
                  <form onSubmit={handleAddClass} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Nama Kelas (contoh: XI RPL 1)"
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200">Tambah</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {adminClasses.map(c => (
                      <span key={c.id} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600">{c.name}</span>
                    ))}
                  </div>
                </div>

                {/* Manage Subjects */}
                <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm space-y-6">
                  <h4 className="text-xl font-black text-zinc-900">Manajemen Mata Pelajaran</h4>
                  <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Nama Mapel (contoh: Matematika)"
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                    <button type="submit" className="bg-emerald-600 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200">Tambah</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {adminSubjects.map(s => (
                      <span key={s.id} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600">{s.name}</span>
                    ))}
                  </div>
                </div>

                {/* Manage Geolocations */}
                <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm space-y-6 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black text-zinc-900">Manajemen Geolokasi (Area Absen)</h4>
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                      Interactive Map
                    </span>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            if (location) {
                              setNewGeoLat(location.lat.toFixed(6));
                              setNewGeoLng(location.lng.toFixed(6));
                              setMessage({ text: "Lokasi saat ini diambil!", type: 'success' });
                            } else {
                              setMessage({ text: "Gagal mendapatkan lokasi GPS", type: 'error' });
                            }
                          }}
                          className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                        >
                          <MapPin className="w-4 h-4" /> Gunakan Lokasi Saya
                        </button>
                        <div className="h-px bg-zinc-100 w-full"></div>
                      </div>

                      <form onSubmit={handleAddGeo} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nama Lokasi</label>
                          <input 
                            type="text" 
                            value={newGeoName}
                            onChange={(e) => setNewGeoName(e.target.value)}
                            placeholder="Contoh: Gedung Utama"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Latitude</label>
                            <input 
                              type="number" step="any"
                              value={newGeoLat}
                              onChange={(e) => setNewGeoLat(e.target.value)}
                              placeholder="Lat"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Longitude</label>
                            <input 
                              type="number" step="any"
                              value={newGeoLng}
                              onChange={(e) => setNewGeoLng(e.target.value)}
                              placeholder="Lng"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Radius (Meter)</label>
                          <input 
                            type="number"
                            value={newGeoRadius}
                            onChange={(e) => setNewGeoRadius(e.target.value)}
                            placeholder="Radius"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                          Simpan Lokasi
                        </button>
                      </form>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Petunjuk</p>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">Klik pada peta di samping untuk mengambil koordinat secara otomatis.</p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 h-[450px] rounded-[32px] overflow-hidden border border-zinc-100 shadow-inner">
                      <RealtimeMap 
                        center={adminGeos.length > 0 ? [adminGeos[0].latitude, adminGeos[0].longitude] : [-6.2000, 106.8166]} 
                        zoom={15}
                        showLiveLabel={false}
                      >
                        {adminGeos.map(g => (
                          <Circle 
                            key={g.id}
                            center={[g.latitude, g.longitude]}
                            radius={g.radius}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                          >
                            <Popup>
                              <div className="p-2">
                                <p className="font-black text-zinc-900">{g.name}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Radius: {g.radius}m</p>
                              </div>
                            </Popup>
                          </Circle>
                        ))}
                        <MapEventsHandler onMapClick={(lat, lng) => {
                          setNewGeoLat(lat.toFixed(6));
                          setNewGeoLng(lng.toFixed(6));
                          setMessage({ text: "Koordinat terpilih!", type: 'success' });
                        }} />
                      </RealtimeMap>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-zinc-100">
                    {adminGeos.map(g => (
                      <div key={g.id} className="flex justify-between items-center p-5 bg-zinc-50 rounded-3xl border border-zinc-100 hover:bg-white hover:shadow-md transition-all group">
                        <div className="space-y-1">
                          <p className="font-black text-zinc-900">{g.name}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                            {g.latitude.toFixed(4)}, {g.longitude.toFixed(4)} • {g.radius}m
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 border border-zinc-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <MapPin className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[32px] px-4 py-3 flex items-center gap-2 shadow-2xl z-50">
        {[
          { id: 'beranda', icon: LayoutDashboard, label: 'Beranda' },
          { id: 'absensi', icon: MapPin, label: 'Absensi' },
          { id: 'jurnal', icon: BookOpen, label: 'Jurnal' },
          { id: 'izin', icon: Calendar, label: 'Izin' },
          { id: 'admin', icon: ShieldCheck, label: 'Admin', adminOnly: true },
        ].map(item => {
          if (item.adminOnly && user.role !== 'admin') return null;
          const active = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => changeTab(item.id as Tab)}
              className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all relative group ${
                active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <item.icon className={`w-6 h-6 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {active && (
                <motion.div 
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
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
                <h3 className="text-2xl font-black text-zinc-900">Tambah User Baru</h3>
                <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-zinc-50 rounded-full">
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
                    placeholder="Password minimal 6 karakter"
                    required
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
