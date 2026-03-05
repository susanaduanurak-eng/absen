import React from 'react';
import { 
  Download, 
  Plus, 
  LayoutDashboard, 
  MoreHorizontal, 
  User, 
  BookOpen, 
  MapPin, 
  Search,
  RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  adminTab: string;
  setAdminTab: (tab: string) => void;
  exportToExcel: () => void;
  setShowAddUser: (show: boolean) => void;
  adminUsers: any[];
  adminAttendance: any[];
  adminJournals: any[];
  adminPermissions: any[];
  adminClasses: any[];
  adminSubjects: any[];
  adminGeos: any[];
  setEditingUser: (user: any) => void;
  setNewUserName: (name: string) => void;
  setNewUserUsername: (username: string) => void;
  setNewUserPassword: (password: string) => void;
  setNewUserRole: (role: string) => void;
  setNewUserNip: (nip: string) => void;
  handleDeleteUser: (id: number) => void;
  formatDate: (date: any) => string;
  formatTime: (date: any) => string;
  handleAddClass: (e: React.FormEvent) => void;
  newClassName: string;
  setNewClassName: (name: string) => void;
  handleAddSubject: (e: React.FormEvent) => void;
  newSubjectName: string;
  setNewSubjectName: (name: string) => void;
  location: { lat: number; lng: number } | null;
  setNewGeoLat: (lat: string) => void;
  setNewGeoLng: (lng: string) => void;
  addressSearch: string;
  setAddressSearch: (search: string) => void;
  handleAddressSearch: () => void;
  isSearchingAddress: boolean;
  geoSearchResults: any[];
  setGeoSearchResults: (results: any[]) => void;
  setNewGeoName: (name: string) => void;
  newGeoName: string;
  newGeoLat: string;
  newGeoLng: string;
  newGeoRadius: string;
  setNewGeoRadius: (radius: string) => void;
  handleAddGeo: (e: React.FormEvent) => void;
  RealtimeMap: any;
  Circle: any;
  Popup: any;
  MapEventsHandler: any;
  setMessage: (msg: { text: string; type: 'success' | 'error' } | null) => void;
}

export default function AdminPanel({
  adminTab,
  setAdminTab,
  exportToExcel,
  setShowAddUser,
  adminUsers,
  adminAttendance,
  adminJournals,
  adminPermissions,
  adminClasses,
  adminSubjects,
  adminGeos,
  setEditingUser,
  setNewUserName,
  setNewUserUsername,
  setNewUserPassword,
  setNewUserRole,
  setNewUserNip,
  handleDeleteUser,
  formatDate,
  formatTime,
  handleAddClass,
  newClassName,
  setNewClassName,
  handleAddSubject,
  newSubjectName,
  setNewSubjectName,
  location,
  setNewGeoLat,
  setNewGeoLng,
  addressSearch,
  setAddressSearch,
  handleAddressSearch,
  isSearchingAddress,
  geoSearchResults,
  setGeoSearchResults,
  setNewGeoName,
  newGeoName,
  newGeoLat,
  newGeoLng,
  newGeoRadius,
  setNewGeoRadius,
  handleAddGeo,
  RealtimeMap,
  Circle,
  Popup,
  MapEventsHandler,
  setMessage
}: AdminPanelProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Manajemen Sistem</h2>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">Panel Administrator</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => {
              setEditingUser(null);
              setShowAddUser(true);
            }}
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
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
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nama / NIP</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Peran</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Array.isArray(adminUsers) && adminUsers.map(u => (
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
                  <td className="px-8 py-5 flex gap-3">
                    <button 
                      onClick={() => {
                        setEditingUser(u);
                        setNewUserName(u.name);
                        setNewUserUsername(u.username);
                        setNewUserPassword(''); // Leave blank to keep current
                        setNewUserRole(u.role);
                        setNewUserNip(u.nip || '');
                        setShowAddUser(true);
                      }}
                      className="text-blue-600 font-bold text-xs hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 font-bold text-xs hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === 'Log Absen' && (
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipe</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Waktu</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lokasi</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Array.isArray(adminAttendance) && adminAttendance.map(a => (
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
                    {formatDate(a.timestamp)} {formatTime(a.timestamp)}
                  </td>
                  <td className="px-8 py-5 text-xs text-zinc-400 truncate max-w-[200px]">{a.address}</td>
                  <td className="px-8 py-5">
                    {a.selfie ? (
                      <button 
                        onClick={() => {
                          const win = window.open("");
                          win?.document.write(`<img src="${a.selfie}" style="max-width:100%">`);
                        }}
                        className="text-blue-600 font-bold text-xs hover:underline"
                      >
                        Lihat Foto
                      </button>
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

      {adminTab === 'Jurnal' && (
        <div className="grid gap-4 md:gap-6">
          {Array.isArray(adminJournals) && adminJournals.map(j => (
            <div key={j.id} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm flex flex-col sm:flex-row gap-4 md:gap-8">
              <div className="w-full sm:w-32 h-48 sm:h-32 bg-zinc-100 rounded-2xl md:rounded-3xl overflow-hidden flex-shrink-0">
                {j.selfie ? (
                  <img src={j.selfie} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-black text-zinc-900">Materi: {j?.subject_name || 'N/A'}</h4>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                      Guru: {j?.user_name || 'N/A'} | Kelas: {j?.class_name || 'N/A'} | Jam ke-{j?.teaching_hours?.toString().replace(/,/g, ', ') || '?'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {formatDate(j.timestamp)}
                  </span>
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed">{j.content}</p>
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Terverifikasi di {j?.latitude?.toFixed(4) || '0'}, {j?.longitude?.toFixed(4) || '0'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'Izin' && (
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipe</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Alasan</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lampiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Array.isArray(adminPermissions) && adminPermissions.map(p => (
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
                      <a href={p.file_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-xs hover:underline">Lihat File</a>
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
          <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm space-y-6">
            <h4 className="text-lg md:text-xl font-black text-zinc-900">Manajemen Kelas</h4>
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
              {Array.isArray(adminClasses) && adminClasses.map(c => (
                <span key={c.id} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600">{c.name}</span>
              ))}
            </div>
          </div>

          {/* Manage Subjects */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm space-y-6">
            <h4 className="text-lg md:text-xl font-black text-zinc-900">Manajemen Mata Pelajaran</h4>
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
              {Array.isArray(adminSubjects) && adminSubjects.map(s => (
                <span key={s.id} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600">{s.name}</span>
              ))}
            </div>
          </div>

          {/* Manage Geolocations */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm space-y-6 md:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h4 className="text-lg md:text-xl font-black text-zinc-900">Manajemen Geolokasi (Area Absen)</h4>
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
                      }
                    }}
                    className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Gunakan Lokasi Saya
                  </button>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cari Alamat</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={addressSearch}
                        onChange={(e) => setAddressSearch(e.target.value)}
                        placeholder="Masukkan nama jalan/tempat..."
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                      />
                      <button 
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSearchingAddress}
                        className="bg-blue-600 text-white px-4 rounded-2xl flex items-center justify-center disabled:opacity-50"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {geoSearchResults.length > 0 && (
                      <div className="bg-white border border-zinc-100 rounded-2xl shadow-xl overflow-hidden mt-2 max-h-48 overflow-y-auto">
                        {geoSearchResults.map((res, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewGeoLat(parseFloat(res.lat).toFixed(6));
                              setNewGeoLng(parseFloat(res.lon).toFixed(6));
                              setNewGeoName(res.display_name.split(',')[0]);
                              setGeoSearchResults([]);
                              setAddressSearch('');
                            }}
                            className="w-full text-left p-3 hover:bg-zinc-50 border-b border-zinc-50 last:border-0 transition-colors"
                          >
                            <p className="text-xs font-bold text-zinc-900 truncate">{res.display_name}</p>
                            <p className="text-[9px] text-zinc-400 font-medium">Lat: {res.lat}, Lng: {res.lon}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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
                    {adminGeos.length > 0 ? 'Perbarui Lokasi Sekolah' : 'Simpan Lokasi Sekolah'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
