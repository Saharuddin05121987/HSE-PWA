// Gerbang UI: hour-meter hanya boleh diisi jika P2H hari ini lulus (juga saat offline).
// Penegakan sebenarnya ada di trigger database (enforce_p2h_before_hm).
const key = (equipmentId: string) => `p2h:${equipmentId}:${new Date().toLocaleDateString('sv-SE')}`;

export const rememberP2H = (equipmentId: string, p2hId: string, passed: boolean) =>
  passed ? localStorage.setItem(key(equipmentId), p2hId) : localStorage.removeItem(key(equipmentId));

/** Mengembalikan id P2H hari ini yang lulus, atau null. Pakai sebagai p2h_id di equipment_usage. */
export const getTodayPassedP2H = (equipmentId: string) => localStorage.getItem(key(equipmentId));
