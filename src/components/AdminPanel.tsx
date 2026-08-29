import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Plus, 
  LayoutDashboard, 
  MoreHorizontal, 
  User, 
  BookOpen, 
  MapPin, 
  Search,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Calendar,
  Filter,
  Layers,
  Clock,
  GraduationCap,
  Sparkles,
  Eye,
  CheckCircle2,
  X,
  List,
  Grid
} from 'lucide-react';
import ExcelImportModal from './ExcelImportModal';
import { exportJournalsToExcel, calculateHoursCount, JournalRecord } from '../utils/excelUtils';

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
  fetchAdminData?: () => Promise<void>;
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
  setMessage,
  fetchAdminData
}: AdminPanelProps) {
  // Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Journal Filters State
  const [journalSearch, setJournalSearch] = useState('');
  const [journalTeacherFilter, setJournalTeacherFilter] = useState('');
  const [journalClassFilter, setJournalClassFilter] = useState('');
  const [journalSubjectFilter, setJournalSubjectFilter] = useState('');
  const [journalDateFilter, setJournalDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [journalStartDate, setJournalStartDate] = useState('');
  const [journalEndDate, setJournalEndDate] = useState('');
  const [journalViewMode, setJournalViewMode] = useState<'cards' | 'table'>('table');

  // Filtered Journals calculation
  const filteredJournals = useMemo(() => {
    if (!Array.isArray(adminJournals)) return [];

    return adminJournals.filter(j => {
      // 1. Search Query
      if (journalSearch.trim()) {
        const query = journalSearch.toLowerCase().trim();
        const matchContent = (j.content || '').toLowerCase().includes(query);
        const matchTeacher = (j.user_name || '').toLowerCase().includes(query);
        const matchClass = (j.class_name || '').toLowerCase().includes(query);
        const matchSubject = (j.subject_name || '').toLowerCase().includes(query);
        if (!matchContent && !matchTeacher && !matchClass && !matchSubject) {
          return false;
        }
      }

      // 2. Teacher Filter
      if (journalTeacherFilter && String(j.user_id) !== String(journalTeacherFilter)) {
        return false;
      }

      // 3. Class Filter
      if (journalClassFilter && String(j.class_id) !== String(journalClassFilter)) {
        return false;
      }

      // 4. Subject Filter
      if (journalSubjectFilter && String(j.subject_id) !== String(journalSubjectFilter)) {
        return false;
      }

      // 5. Date Filter
      if (journalDateFilter !== 'all' && j.timestamp) {
        const jDate = new Date(j.timestamp);
        const now = new Date();

        if (journalDateFilter === 'today') {
          const isToday = jDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (journalDateFilter === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          if (jDate < oneWeekAgo) return false;
        } else if (journalDateFilter === 'month') {
          const isSameMonth = jDate.getMonth() === now.getMonth() && jDate.getFullYear() === now.getFullYear();
          if (!isSameMonth) return false;
        } else if (journalDateFilter === 'custom') {
          if (journalStartDate) {
            const start = new Date(journalStartDate);
            start.setHours(0, 0, 0, 0);
            if (jDate < start) return false;
          }
          if (journalEndDate) {
            const end = new Date(journalEndDate);
            end.setHours(23, 59, 59, 999);
            if (jDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [
    adminJournals,
    journalSearch,
    journalTeacherFilter,
    journalClassFilter,
    journalSubjectFilter,
    journalDateFilter,
    journalStartDate,
    journalEndDate
  ]);

  // Dynamic Statistics
  const journalStats = useMemo(() => {
    let totalHours = 0;
    const teachersSet = new Set<string>();
    const classesSet = new Set<string>();

    filteredJournals.forEach(j => {
      totalHours += calculateHoursCount(j.teaching_hours);
      if (j.user_name) teachersSet.add(j.user_name);
      if (j.class_name) classesSet.add(j.class_name);
    });

    return {
      totalCount: filteredJournals.length,
      totalHours,
      activeTeachers: teachersSet.size,
      activeClasses: classesSet.size
    };
  }, [filteredJournals]);

  // Export Journal Handler
  const handleExportJournal = () => {
    try {
      if (filteredJournals.length === 0) {
        setMessage({ text: 'Tidak ada data jurnal yang cocok untuk diekspor.', type: 'error' });
        return;
      }

      let dateLabel = 'Semua Periode';
      if (journalDateFilter === 'today') dateLabel = 'Hari Ini';
      else if (journalDateFilter === 'week') dateLabel = '7 Hari Terakhir';
      else if (journalDateFilter === 'month') dateLabel = 'Bulan Ini';
      else if (journalDateFilter === 'custom') {
        dateLabel = `${journalStartDate || 'Awal'} s.d ${journalEndDate || 'Sekarang'}`;
      }

      exportJournalsToExcel(filteredJournals as JournalRecord[], dateLabel, 'SMKN 1 Poco Ranaka');
      setMessage({ 
        text: `Berhasil mengekspor ${filteredJournals.length} rekapan jurnal ke Excel!`, 
        type: 'success' 
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal mengekspor jurnal.', type: 'error' });
    }
  };

  const handleRefresh = async () => {
    if (fetchAdminData) {
      await fetchAdminData();
      setMessage({ text: 'Data admin berhasil diperbarui.', type: 'success' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Global Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Manajemen & Rekapan</h2>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            Panel Administrator • SMKN 1 Poco Ranaka
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Export Absensi */}
          <button 
            onClick={exportToExcel}
            title="Ekspor seluruh log presensi kehadiran pegawai ke file Excel"
            className="flex-1 sm:flex-none bg-zinc-900 hover:bg-black text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Absensi</span>
          </button>

          {/* Quick Export Jurnal */}
          <button 
            onClick={handleExportJournal}
            title="Ekspor rekapitulasi data jurnal pembelajaran guru ke file Excel"
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Jurnal</span>
          </button>

          {/* Import Excel Modal Trigger */}
          <button 
            onClick={() => setShowImportModal(true)}
            title="Impor data Jurnal, User Guru, atau Kelas melalui file Excel"
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          {/* Tambah User */}
          <button 
            onClick={() => {
              setEditingUser(null);
              setShowAddUser(true);
            }}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-3xl border border-zinc-100 shadow-sm overflow-x-auto no-scrollbar">
        {['Ringkasan', 'Log Absen', 'Jurnal', 'Izin', 'Manajemen User', 'Pengaturan'].map((t) => (
          <button 
            key={t}
            onClick={() => setAdminTab(t)}
            className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
              adminTab === t 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            {t === 'Jurnal' && <BookOpen className="w-3.5 h-3.5" />}
            {t === 'Log Absen' && <Clock className="w-3.5 h-3.5" />}
            {t === 'Manajemen User' && <User className="w-3.5 h-3.5" />}
            <span>{t}</span>
            {t === 'Jurnal' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                adminTab === t ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {adminJournals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===================== TAB: RINGKASAN ===================== */}
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
                { label: 'Admin', count: adminUsers.filter(u => u.role === 'admin').length, total: adminUsers.length || 1, color: 'bg-blue-500' },
                { label: 'Guru', count: adminUsers.filter(u => u.role === 'guru').length, total: adminUsers.length || 1, color: 'bg-emerald-500' },
                { label: 'Pegawai', count: adminUsers.filter(u => u.role === 'pegawai').length, total: adminUsers.length || 1, color: 'bg-orange-500' },
              ].map((r, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400">{r.label}</span>
                    <span className="text-zinc-900">{r.count} Orang</span>
                  </div>
                  <div className="h-3 bg-zinc-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${r.color} rounded-full`}
                      style={{ width: `${(r.count / r.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: JURNAL MENGAJAR (ENHANCED WITH REKAPAN & EXCEL EXPORT/IMPORT) ===================== */}
      {adminTab === 'Jurnal' && (
        <div className="space-y-6">
          
          {/* Jurnal Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-zinc-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Jurnal</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900">{journalStats.totalCount}</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Dari {adminJournals.length} total rekapan
              </p>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-zinc-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Jam Mengajar</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900">{journalStats.totalHours} <span className="text-sm font-bold text-zinc-400">Jam</span></p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                Tatap muka terlaksana
              </p>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-zinc-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Guru Aktif Mengisi</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900">{journalStats.activeTeachers} <span className="text-sm font-bold text-zinc-400">Guru</span></p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Tercatat pada filter
              </p>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-zinc-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kelas Terlayani</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-zinc-900">{journalStats.activeClasses} <span className="text-sm font-bold text-zinc-400">Kelas</span></p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Menerima pembelajaran
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-5 md:p-6 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="Cari materi, nama guru, kelas, atau mapel..."
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {journalSearch && (
                  <button 
                    onClick={() => setJournalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Export & Import Jurnal */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJournal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Rekap Jurnal ({filteredJournals.length})</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 text-zinc-600" />
                  <span>Import Excel</span>
                </button>

                {/* View Switcher */}
                <div className="hidden sm:flex items-center bg-zinc-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setJournalViewMode('table')}
                    className={`p-2 rounded-xl transition-all ${
                      journalViewMode === 'table' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setJournalViewMode('cards')}
                    className={`p-2 rounded-xl transition-all ${
                      journalViewMode === 'cards' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                    title="Tampilan Kartu"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-zinc-100">
              
              {/* Filter Guru */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Guru</label>
                <select
                  value={journalTeacherFilter}
                  onChange={(e) => setJournalTeacherFilter(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                >
                  <option value="">Semua Guru</option>
                  {adminUsers.filter(u => u.role === 'guru' || u.role === 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Kelas */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Kelas</label>
                <select
                  value={journalClassFilter}
                  onChange={(e) => setJournalClassFilter(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {adminClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Mapel */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Mata Pelajaran</label>
                <select
                  value={journalSubjectFilter}
                  onChange={(e) => setJournalSubjectFilter(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                >
                  <option value="">Semua Mapel</option>
                  {adminSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Periode */}
              <div>
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Periode</label>
                <select
                  value={journalDateFilter}
                  onChange={(e: any) => setJournalDateFilter(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="today">Hari Ini</option>
                  <option value="week">7 Hari Terakhir</option>
                  <option value="month">Bulan Ini</option>
                  <option value="custom">Rentang Tanggal</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setJournalSearch('');
                    setJournalTeacherFilter('');
                    setJournalClassFilter('');
                    setJournalSubjectFilter('');
                    setJournalDateFilter('all');
                    setJournalStartDate('');
                    setJournalEndDate('');
                  }}
                  className="w-full py-2 px-3 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {journalDateFilter === 'custom' && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={journalStartDate}
                    onChange={(e) => setJournalStartDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={journalEndDate}
                    onChange={(e) => setJournalEndDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Jurnal Data View: Table or Cards */}
          {filteredJournals.length === 0 ? (
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-12 text-center border border-zinc-100 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-zinc-50 text-zinc-300 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-zinc-800">Tidak Ada Rekap Jurnal Ditemukan</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau filter yang dipilih, atau import rekapan dari Excel.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Import Jurnal dari Excel
                </button>
              </div>
            </div>
          ) : journalViewMode === 'table' ? (
            /* Table View */
            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[950px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">No</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tanggal & Waktu</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Guru Pengajar</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kelas & Mapel</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Jam Ke</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ringkasan Materi</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lokasi</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dokumentasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredJournals.map((j, index) => (
                    <tr key={j.id || index} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-zinc-900 text-xs">{formatDate(j.timestamp)}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{formatTime(j.timestamp)} WITA</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 text-xs">{j.user_name || 'N/A'}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{j.nip ? `NIP: ${j.nip}` : 'NIP Belum Diatur'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider mr-1.5">
                          {j.class_name || 'N/A'}
                        </span>
                        <p className="font-bold text-zinc-800 text-xs mt-1">{j.subject_name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 font-black text-[11px] rounded-lg">
                          Jam ke-{j.teaching_hours ? String(j.teaching_hours).replace(/,/g, ', ') : '1'}
                        </span>
                        <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                          ({calculateHoursCount(j.teaching_hours)} Jam Tatap Muka)
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-zinc-600 font-medium max-w-xs line-clamp-2" title={j.content}>
                          {j.content}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {j.latitude && j.longitude ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{Number(j.latitude).toFixed(3)}, {Number(j.longitude).toFixed(3)}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-300 text-[10px]">Tidak ada GPS</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {j.selfie ? (
                          <button
                            onClick={() => setPreviewPhoto(j.selfie)}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-zinc-300 text-xs">Tanpa Foto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid gap-4 md:gap-6">
              {filteredJournals.map(j => (
                <div key={j.id} className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-sm flex flex-col sm:flex-row gap-5 md:gap-8 hover:shadow-md transition-shadow">
                  <div className="w-full sm:w-36 h-48 sm:h-36 bg-zinc-100 rounded-2xl md:rounded-3xl overflow-hidden flex-shrink-0 relative group">
                    {j.selfie ? (
                      <>
                        <img src={j.selfie} alt="Dokumentasi Jurnal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          onClick={() => setPreviewPhoto(j.selfie)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          <Eye className="w-5 h-5 mr-1" /> Perbesar
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-wider rounded-xl">
                            {j.class_name || 'N/A'}
                          </span>
                          <span className="px-3 py-1 bg-zinc-100 text-zinc-700 font-black text-[10px] uppercase tracking-wider rounded-xl">
                            Jam ke-{j?.teaching_hours?.toString().replace(/,/g, ', ') || '1'} ({calculateHoursCount(j.teaching_hours)} Jam)
                          </span>
                        </div>
                        <h4 className="text-lg md:text-xl font-black text-zinc-900 mt-2">
                          {j?.subject_name || 'Mata Pelajaran'}
                        </h4>
                        <p className="text-[11px] font-bold text-zinc-500 mt-0.5">
                          Guru: <span className="text-zinc-800">{j?.user_name || 'N/A'}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 self-start">
                        {formatDate(j.timestamp)} • {formatTime(j.timestamp)}
                      </span>
                    </div>

                    <p className="text-zinc-700 text-sm leading-relaxed bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                      {j.content}
                    </p>

                    <div className="flex items-center gap-2 text-emerald-600 pt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {j.latitude && j.longitude 
                          ? `Terverifikasi GPS: ${Number(j.latitude).toFixed(4)}, ${Number(j.longitude).toFixed(4)}`
                          : 'Lokasi Tidak Tercatat'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: LOG ABSEN ===================== */}
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
                  <td className="px-8 py-5 text-xs text-zinc-400 truncate max-w-[200px]">{a.address || `${a.latitude}, ${a.longitude}`}</td>
                  <td className="px-8 py-5">
                    {a.selfie ? (
                      <button 
                        onClick={() => setPreviewPhoto(a.selfie)}
                        className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Foto
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

      {/* ===================== TAB: IZIN ===================== */}
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

      {/* ===================== TAB: MANAJEMEN USER ===================== */}
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
                        setNewUserPassword('');
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

      {/* ===================== TAB: PENGATURAN ===================== */}
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

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(msg) => setMessage({ text: msg, type: 'success' })}
        adminUsers={adminUsers}
        adminClasses={adminClasses}
        adminSubjects={adminSubjects}
        refreshData={fetchAdminData || (async () => {})}
      />

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Dokumentasi" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
