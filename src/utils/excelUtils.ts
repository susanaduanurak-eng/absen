import * as XLSX from 'xlsx';

export interface JournalRecord {
  id: number;
  user_id: number;
  user_name?: string;
  nip?: string;
  class_id: number;
  class_name?: string;
  subject_id: number;
  subject_name?: string;
  teaching_hours?: string;
  content: string;
  selfie?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name?: string;
  type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  address?: string;
  selfie?: string;
}

// Helper to count teaching hours like "1,2,3" -> 3 hours, or "1-3" -> 3 hours
export function calculateHoursCount(hoursStr?: string): number {
  if (!hoursStr) return 1;
  const str = String(hoursStr).trim();
  if (str.includes(',')) {
    return str.split(',').filter(s => s.trim().length > 0).length;
  }
  if (str.includes('-')) {
    const parts = str.split('-').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
    if (parts.length === 2 && parts[1] >= parts[0]) {
      return (parts[1] - parts[0]) + 1;
    }
  }
  return 1;
}

/**
 * Export Journals to formatted Excel with 2 sheets:
 * 1. Rekap Jurnal Lengkap
 * 2. Ringkasan Per Guru (Statistik Jam Mengajar)
 */
export function exportJournalsToExcel(
  journals: JournalRecord[],
  dateFilterLabel: string = 'Semua Periode',
  schoolName: string = 'SMKN 1 POCO RANAKA'
) {
  if (!journals || journals.length === 0) {
    throw new Error('Tidak ada data jurnal yang dipilih untuk diekspor.');
  }

  // 1. Sheet 1: Rekap Jurnal Detail
  const detailRows = journals.map((j, index) => {
    let formattedDate = '-';
    let formattedTime = '-';
    try {
      const d = new Date(j.timestamp);
      formattedDate = d.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Makassar',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      formattedTime = d.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' WITA';
    } catch (e) {
      formattedDate = j.timestamp || '-';
    }

    const hours = j.teaching_hours ? String(j.teaching_hours).replace(/,/g, ', ') : '1';
    const hoursCount = calculateHoursCount(j.teaching_hours);

    return {
      'No': index + 1,
      'Tanggal': formattedDate,
      'Waktu Input': formattedTime,
      'Nama Guru': j.user_name || 'Tidak diketahui',
      'NIP': j.nip || '-',
      'Kelas': j.class_name || 'Tidak diketahui',
      'Mata Pelajaran': j.subject_name || 'Tidak diketahui',
      'Jam Pelajaran Ke': `Jam ke-${hours}`,
      'Jumlah Jam': hoursCount,
      'Ringkasan Materi / Pembelajaran': j.content || '',
      'Status Lokasi': (j.latitude && j.longitude)
        ? `Terverifikasi (${Number(j.latitude).toFixed(4)}, ${Number(j.longitude).toFixed(4)})`
        : 'Tidak terdeteksi',
      'Dokumentasi Foto': j.selfie ? 'Ada Foto Selfie' : 'Tidak Ada'
    };
  });

  // 2. Sheet 2: Ringkasan Per Guru
  const teacherStatsMap: { [teacherName: string]: { name: string; nip: string; totalJournals: number; totalHours: number; classes: Set<string>; subjects: Set<string> } } = {};

  journals.forEach(j => {
    const tName = j.user_name || 'Tanpa Nama';
    if (!teacherStatsMap[tName]) {
      teacherStatsMap[tName] = {
        name: tName,
        nip: j.nip || '-',
        totalJournals: 0,
        totalHours: 0,
        classes: new Set(),
        subjects: new Set()
      };
    }
    teacherStatsMap[tName].totalJournals += 1;
    teacherStatsMap[tName].totalHours += calculateHoursCount(j.teaching_hours);
    if (j.class_name) teacherStatsMap[tName].classes.add(j.class_name);
    if (j.subject_name) teacherStatsMap[tName].subjects.add(j.subject_name);
  });

  const summaryRows = Object.values(teacherStatsMap).map((t, idx) => ({
    'No': idx + 1,
    'Nama Guru': t.name,
    'NIP': t.nip,
    'Total Sesi Jurnal': t.totalJournals,
    'Total Jam Tatap Muka': t.totalHours + ' Jam',
    'Daftar Kelas Diajar': Array.from(t.classes).join(', ') || '-',
    'Daftar Mapel Diajar': Array.from(t.subjects).join(', ') || '-'
  }));

  // Create Workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  // Column Widths for readability
  wsDetail['!cols'] = [
    { wch: 6 },   // No
    { wch: 20 },  // Tanggal
    { wch: 15 },  // Waktu
    { wch: 26 },  // Nama Guru
    { wch: 20 },  // NIP
    { wch: 16 },  // Kelas
    { wch: 24 },  // Mapel
    { wch: 18 },  // Jam Ke
    { wch: 12 },  // Jml Jam
    { wch: 45 },  // Isi Jurnal
    { wch: 26 },  // Lokasi
    { wch: 18 }   // Foto
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Rekap Jurnal Detail');

  // Sheet 2
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 6 },   // No
    { wch: 26 },  // Nama Guru
    { wch: 20 },  // NIP
    { wch: 18 },  // Total Sesi
    { wch: 22 },  // Total Jam
    { wch: 30 },  // Daftar Kelas
    { wch: 35 }   // Daftar Mapel
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Per Guru');

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Rekap_Jurnal_${schoolName.replace(/\s+/g, '_')}_${todayStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generate and download template for Journal Import
 */
export function downloadJournalTemplate(
  classes: any[] = [],
  subjects: any[] = [],
  users: any[] = []
) {
  const sampleData = [
    {
      'Nama / Username Guru': users[0]?.name || users[0]?.username || 'Guru Contoh',
      'Kelas': classes[0]?.name || 'X RPL 1',
      'Mata Pelajaran': subjects[0]?.name || 'Matematika',
      'Jam Ke': '1, 2',
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Materi / Isi Jurnal': 'Pembahasan bab aljabar dasar dan latihan soal di kelas'
    },
    {
      'Nama / Username Guru': users[1]?.name || users[1]?.username || 'guru',
      'Kelas': classes[1]?.name || 'XI RPL 1',
      'Mata Pelajaran': subjects[1]?.name || 'Bahasa Indonesia',
      'Jam Ke': '3, 4',
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Materi / Isi Jurnal': 'Analisis struktur teks eksposisi dan presentasi kelompok'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 26 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 22 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Template Jurnal');

  // Add reference sheet for existing classes, subjects, and teachers
  const refData: any[] = [];
  const maxLen = Math.max(users.length, classes.length, subjects.length);
  for (let i = 0; i < maxLen; i++) {
    refData.push({
      'Daftar Guru di Sistem': users[i] ? `${users[i].name} (${users[i].username})` : '',
      'Daftar Kelas di Sistem': classes[i]?.name || '',
      'Daftar Mata Pelajaran': subjects[i]?.name || ''
    });
  }

  if (refData.length > 0) {
    const wsRef = XLSX.utils.json_to_sheet(refData);
    wsRef['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Daftar Referensi');
  }

  XLSX.writeFile(wb, 'Template_Import_Jurnal.xlsx');
}

/**
 * Generate and download template for User Import
 */
export function downloadUserTemplate() {
  const sampleData = [
    {
      'Nama Lengkap': 'Ahmad Fauzi, S.Pd',
      'Username': 'ahmad_fauzi',
      'Password': 'password123',
      'Role (admin/guru/pegawai)': 'guru',
      'NIP': '198503152010011012'
    },
    {
      'Nama Lengkap': 'Siti Rahmawati, S.Kom',
      'Username': 'siti_rahma',
      'Password': 'password123',
      'Role (admin/guru/pegawai)': 'guru',
      'NIP': '199008202015022005'
    },
    {
      'Nama Lengkap': 'Budi Santoso',
      'Username': 'budi_staf',
      'Password': 'password123',
      'Role (admin/guru/pegawai)': 'pegawai',
      'NIP': '198812012012031003'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Template User');
  XLSX.writeFile(wb, 'Template_Import_User.xlsx');
}

/**
 * Generate and download template for Classes & Subjects Import
 */
export function downloadClassSubjectTemplate() {
  const sampleClasses = [
    { 'Nama Kelas': 'X RPL 1' },
    { 'Nama Kelas': 'X RPL 2' },
    { 'Nama Kelas': 'XI TKJ 1' },
    { 'Nama Kelas': 'XII OTKP 1' }
  ];

  const sampleSubjects = [
    { 'Nama Mata Pelajaran': 'Matematika' },
    { 'Nama Mata Pelajaran': 'Bahasa Indonesia' },
    { 'Nama Mata Pelajaran': 'Bahasa Inggris' },
    { 'Nama Mata Pelajaran': 'Pemrograman Web' },
    { 'Nama Mata Pelajaran': 'Basis Data' }
  ];

  const wb = XLSX.utils.book_new();
  const wsClass = XLSX.utils.json_to_sheet(sampleClasses);
  wsClass['!cols'] = [{ wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsClass, 'Daftar Kelas');

  const wsSubj = XLSX.utils.json_to_sheet(sampleSubjects);
  wsSubj['!cols'] = [{ wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSubj, 'Daftar Mapel');

  XLSX.writeFile(wb, 'Template_Import_Kelas_Mapel.xlsx');
}
