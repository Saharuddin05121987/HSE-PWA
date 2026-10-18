export type Result = 'pass' | 'fail' | 'na';
export type P2HItem = { key: string; label: string; critical: boolean };

// Checklist P2H alat berat (sesuaikan dengan SOP perusahaan)
export const P2H_HEAVY: P2HItem[] = [
  { key: 'brake',    label: 'Rem berfungsi baik',               critical: true },
  { key: 'steering', label: 'Kemudi / steering normal',         critical: true },
  { key: 'horn',     label: 'Klakson dan alarm mundur',         critical: true },
  { key: 'lights',   label: 'Lampu utama dan sein',             critical: false },
  { key: 'seatbelt', label: 'Sabuk pengaman',                   critical: true },
  { key: 'hydraulic',label: 'Tidak ada kebocoran hidrolik',     critical: true },
  { key: 'oil',      label: 'Level oli mesin dan coolant',      critical: false },
  { key: 'tires',    label: 'Ban / track dalam kondisi baik',   critical: false },
  { key: 'extinguisher', label: 'APAR tersedia dan terisi',     critical: false },
  { key: 'mirror',   label: 'Kaca spion dan kaca depan',        critical: false },
];

export type PTWKey = 'working_at_height' | 'hot_work' | 'confined_space' | 'lifting';
export const PTW_LABEL: Record<PTWKey, string> = {
  working_at_height: 'Bekerja di ketinggian',
  hot_work: 'Pekerjaan panas',
  confined_space: 'Ruang terbatas',
  lifting: 'Pengangkatan',
};
// Semua item wajib dicentang sebelum permit bisa diajukan
export const PTW_CHECKLIST: Record<PTWKey, { key: string; label: string }[]> = {
  working_at_height: [
    { key: 'harness', label: 'Full body harness dan lanyard diperiksa' },
    { key: 'anchor', label: 'Titik jangkar kuat dan teridentifikasi' },
    { key: 'scaffold', label: 'Scaffold / platform bertag hijau' },
    { key: 'barricade', label: 'Area bawah dibarikade' },
    { key: 'rescue', label: 'Rencana penyelamatan tersedia' },
  ],
  hot_work: [
    { key: 'flammable', label: 'Material mudah terbakar disingkirkan (radius 11 m)' },
    { key: 'apar', label: 'APAR siap di lokasi' },
    { key: 'firewatch', label: 'Fire watch ditugaskan' },
    { key: 'gas', label: 'Uji gas mudah terbakar dilakukan' },
    { key: 'blanket', label: 'Fire blanket terpasang' },
  ],
  confined_space: [
    { key: 'gastest', label: 'Uji atmosfer (O2, LEL, H2S, CO) memenuhi syarat' },
    { key: 'ventilation', label: 'Ventilasi terpasang' },
    { key: 'attendant', label: 'Penjaga lubang (attendant) ditugaskan' },
    { key: 'isolation', label: 'Isolasi energi (LOTO) dilakukan' },
    { key: 'rescue', label: 'Peralatan penyelamatan siap' },
  ],
  lifting: [
    { key: 'crane', label: 'Sertifikat crane / alat angkat berlaku' },
    { key: 'rigging', label: 'Sling dan shackle diperiksa' },
    { key: 'weight', label: 'Berat beban dan radius dihitung' },
    { key: 'signalman', label: 'Operator, rigger, dan signalman kompeten' },
    { key: 'exclusion', label: 'Zona larangan masuk dibarikade' },
  ],
};

export type ToolCategory = 'heavy_equipment' | 'hand_tool' | 'electrical_tool';
export const TOOL_LABEL: Record<ToolCategory, string> = {
  heavy_equipment: 'Alat berat', hand_tool: 'Alat tangan', electrical_tool: 'Alat listrik',
};
// Contoh checklist; sesuaikan dengan SOP perusahaan
export const INSPECTION: Record<ToolCategory, P2HItem[]> = {
  heavy_equipment: [
    { key: 'structure', label: 'Struktur dan bodi tanpa retak', critical: true },
    { key: 'safety_device', label: 'Perangkat pengaman berfungsi', critical: true },
    { key: 'leak', label: 'Tidak ada kebocoran oli/hidrolik', critical: false },
    { key: 'cert', label: 'Sertifikat/SILO operator berlaku', critical: true },
    { key: 'housekeeping', label: 'Kebersihan kabin dan area kerja', critical: false },
  ],
  hand_tool: [
    { key: 'handle', label: 'Gagang kuat, tidak retak/longgar', critical: true },
    { key: 'head', label: 'Mata alat tidak aus atau bergerigi', critical: false },
    { key: 'insulation', label: 'Isolasi gagang utuh (bila ada)', critical: true },
    { key: 'color', label: 'Penanda inspeksi (color code) berlaku', critical: false },
  ],
  electrical_tool: [
    { key: 'cable', label: 'Kabel dan colokan utuh, tanpa kupasan', critical: true },
    { key: 'guard', label: 'Pelindung (guard) terpasang', critical: true },
    { key: 'switch', label: 'Saklar berfungsi dan tidak macet', critical: true },
    { key: 'grounding', label: 'Grounding / RCD tersedia', critical: true },
    { key: 'tag', label: 'Tag uji listrik berlaku', critical: false },
  ],
};
