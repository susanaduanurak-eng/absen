import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  FileText, 
  Users, 
  BookOpen, 
  GraduationCap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  downloadJournalTemplate, 
  downloadUserTemplate, 
  downloadClassSubjectTemplate 
} from '../utils/excelUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  adminUsers: any[];
  adminClasses: any[];
  adminSubjects: any[];
  refreshData: () => Promise<void>;
}

type ImportType = 'journals' | 'users' | 'classes_subjects';

export default function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  adminUsers,
  adminClasses,
  adminSubjects,
  refreshData,
}: ExcelImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportType>('journals');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    inserted: number;
    updated?: number;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTabChange = (tab: ImportType) => {
    setActiveTab(tab);
    resetState();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrorMsg(null);
    setImportResult(null);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        setErrorMsg('File Excel kosong atau tidak memiliki data pada sheet pertama.');
        setParsedData([]);
        return;
      }

      setParsedData(rawJson);
    } catch (err: any) {
      setErrorMsg('Gagal membaca file Excel: ' + (err.message || 'Format tidak didukung'));
      setParsedData([]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      setErrorMsg('Silakan unggah file Excel yang valid terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'journals') {
        // Map raw Excel rows to journal API structure
        const journalsPayload = parsedData.map(row => {
          // Normalize column keys
          const teacherName = row['Nama / Username Guru'] || row['Nama Guru'] || row['Guru'] || row['Username'] || row['username'] || '';
          const className = row['Kelas'] || row['Nama Kelas'] || row['kelas'] || '';
          const subjectName = row['Mata Pelajaran'] || row['Mapel'] || row['Mata_Pelajaran'] || '';
          const teachingHours = row['Jam Ke'] || row['Jam ke'] || row['Jam Pelajaran'] || row['Jam'] || '1';
          const content = row['Materi / Isi Jurnal'] || row['Materi'] || row['Isi Jurnal'] || row['Kegiatan'] || 'Kegiatan Mengajar';
          const rawDate = row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || row['Waktu'] || '';

          let timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
          if (rawDate) {
            try {
              // If Excel numeric serial date
              if (typeof rawDate === 'number') {
                const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                timestamp = dateObj.toISOString().slice(0, 19).replace('T', ' ');
              } else {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                  timestamp = parsed.toISOString().slice(0, 19).replace('T', ' ');
                }
              }
            } catch (e) {}
          }

          return {
            teacherName: String(teacherName).trim(),
            className: String(className).trim(),
            subjectName: String(subjectName).trim(),
            teachingHours: String(teachingHours).trim(),
            content: String(content).trim(),
            timestamp
          };
        }).filter(j => j.teacherName || j.className || j.subjectName);

        if (journalsPayload.length === 0) {
          throw new Error('Tidak ada baris data jurnal yang valid ditemukan dalam file.');
        }

        const res = await fetch('/api/admin/import/journals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journals: journalsPayload })
        });
        const result = await res.json();

        if (result.success) {
          setImportResult(result);
          await refreshData();
          onSuccess(`Berhasil mengimpor ${result.inserted} jurnal mengajar!`);
        } else {
          throw new Error(result.message || 'Gagal mengimpor jurnal.');
        }

      } else if (activeTab === 'users') {
        const usersPayload = parsedData.map(row => {
          const name = row['Nama Lengkap'] || row['Nama'] || row['Name'] || '';
          const username = row['Username'] || row['username'] || '';
          const password = row['Password'] || row['password'] || '123456';
          const role = (row['Role (admin/guru/pegawai)'] || row['Role'] || row['Peran'] || 'guru').toString().toLowerCase();
          const nip = row['NIP'] || row['nip'] || null;

          return {
            name: String(name).trim(),
            username: String(username).trim(),
            password: String(password).trim(),
            role: ['admin', 'guru', 'pegawai'].includes(role) ? role : 'guru',
            nip: nip ? String(nip).trim() : null
          };
        }).filter(u => u.name && u.username);

        if (usersPayload.length === 0) {
          throw new Error('Tidak ada baris data user yang memiliki Nama dan Username.');
        }

        const res = await fetch('/api/admin/import/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: usersPayload })
        });
        const result = await res.json();

        if (result.success) {
          setImportResult(result);
          await refreshData();
          onSuccess(`Berhasil mengimpor ${result.inserted} user baru dan memperbarui ${result.updated} user.`);
        } else {
          throw new Error(result.message || 'Gagal mengimpor user.');
        }

      } else if (activeTab === 'classes_subjects') {
        // Collect Classes & Subjects from all sheets or first sheet
        const classNames: string[] = [];
        const subjectNames: string[] = [];

        parsedData.forEach(row => {
          const c = row['Nama Kelas'] || row['Kelas'];
          const s = row['Nama Mata Pelajaran'] || row['Mata Pelajaran'] || row['Mapel'];
          if (c && String(c).trim()) classNames.push(String(c).trim());
          if (s && String(s).trim()) subjectNames.push(String(s).trim());
        });

        let totalClass = 0;
        let totalSubj = 0;

        if (classNames.length > 0) {
          const resC = await fetch('/api/admin/import/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classes: classNames })
          });
          const dataC = await resC.json();
          totalClass = dataC.inserted || 0;
        }

        if (subjectNames.length > 0) {
          const resS = await fetch('/api/admin/import/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjects: subjectNames })
          });
          const dataS = await resS.json();
          totalSubj = dataS.inserted || 0;
        }

        setImportResult({
          success: true,
          inserted: totalClass + totalSubj
        });
        await refreshData();
        onSuccess(`Berhasil menambahkan ${totalClass} kelas baru dan ${totalSubj} mata pelajaran baru.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses import.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-100 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Import Data Excel</h3>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-0.5">
                SMKN 1 Poco Ranaka • Batch Importer
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 md:px-8 pt-6">
          <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-2xl">
            <button
              onClick={() => handleTabChange('journals')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'journals'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Jurnal Mengajar</span>
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>User & Guru</span>
            </button>
            <button
              onClick={() => handleTabChange('classes_subjects')}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'classes_subjects'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-orange-600" />
              <span>Kelas & Mapel</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Step 1: Download Template */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-md">
                Langkah 1
              </span>
              <h4 className="font-bold text-zinc-900 text-sm">Unduh Format Template Excel</h4>
              <p className="text-xs text-zinc-500">
                Gunakan template resmi agar susunan kolom sesuai dengan sistem.
              </p>
            </div>
            <button
              onClick={() => {
                if (activeTab === 'journals') downloadJournalTemplate(adminClasses, adminSubjects, adminUsers);
                else if (activeTab === 'users') downloadUserTemplate();
                else downloadClassSubjectTemplate();
              }}
              className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Unduh Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Langkah 2: Pilih atau Tarik File Excel (.xlsx / .xls)
              </label>
              {file && (
                <button 
                  onClick={resetState}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Ganti File
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                file
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-zinc-200 hover:border-blue-500 hover:bg-blue-50/20 bg-zinc-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{file.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {parsedData.length} baris terdeteksi
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-800 text-sm">Klik untuk memilih file atau seret file ke sini</p>
                    <p className="text-xs text-zinc-400 mt-1">Mendukung format Microsoft Excel (.xlsx, .xls)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-600 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Terjadi Kesalahan</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-2 text-emerald-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Proses Import Selesai!
              </div>
              <p className="text-xs text-emerald-700">
                {importResult.inserted} data baru berhasil dimasukkan ke dalam database.
                {importResult.updated ? ` ${importResult.updated} data diperbarui.` : ''}
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                  <p className="font-bold text-[11px] text-amber-800 mb-1">Catatan Peringatan ({importResult.errors.length}):</p>
                  <ul className="text-[11px] text-amber-700 list-disc list-inside max-h-24 overflow-y-auto space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Data Preview Table */}
          {parsedData.length > 0 && !importResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                  Pratinjau Data ({parsedData.length} Baris)
                </h5>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Menampilkan maks. 5 baris pertama
                </span>
              </div>
              <div className="border border-zinc-100 rounded-2xl overflow-hidden overflow-x-auto shadow-sm max-h-52">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 text-zinc-600 font-black text-[10px] uppercase tracking-wider">
                    <tr>
                      {Object.keys(parsedData[0] || {}).map((col, idx) => (
                        <th key={idx} className="px-4 py-2.5 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 bg-white">
                    {parsedData.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/50">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="px-4 py-2 text-zinc-600 whitespace-nowrap truncate max-w-[200px]">
                            {String(val || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            {importResult ? 'Selesai / Tutup' : 'Batal'}
          </button>
          
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsedData.length === 0 || isProcessing || !!importResult}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <span>Proses Import ({parsedData.length} Baris)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
