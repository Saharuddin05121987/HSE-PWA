'use client';
import { useEffect, useRef, useState } from 'react';
import { enqueue } from '@/lib/offline-db';

type Props = {
  userId: string;
  userName: string;
  maxAccuracyM?: number;
  onSaved?: (clientId: string) => void;
};

type Fix = { lat: number; lng: number; acc: number };

/**
 * ANTI-FRAUD: hanya getUserMedia (kamera langsung).
 * Tidak ada <input type="file"> maupun atribut capture => galeri tidak bisa dipilih.
 * Watermark digambar ke canvas lalu di-export, jadi sudah menyatu di piksel foto.
 */
export default function LiveCameraCapture({ userId, userName, maxAccuracyM = 30, onSaved }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let s: MediaStream | undefined;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } }, audio: false })
      .then((st) => {
        s = st; setStream(st);
        if (videoRef.current) videoRef.current.srcObject = st;
      })
      .catch(() => setErr('Izin kamera ditolak. Aktifkan kamera untuk melapor.'));
    return () => s?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (p) => setFix({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => setErr('Izin lokasi ditolak. Aktifkan GPS untuk melapor.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const gpsOk = !!fix && fix.acc <= maxAccuracyM;

  async function capture() {
    const v = videoRef.current;
    if (!v || !fix || !gpsOk) return;
    setBusy(true);
    try {
      const w = v.videoWidth, h = v.videoHeight;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(v, 0, 0, w, h);

      const capturedAt = new Date();
      const lines = [
        `GPS ${fix.lat.toFixed(6)}, ${fix.lng.toFixed(6)}  (±${Math.round(fix.acc)} m)`,
        capturedAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }),
        `Pelapor: ${userName}`,
      ];
      const fs = Math.max(18, Math.round(w / 38));
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      const pad = fs * 0.6, boxH = lines.length * fs * 1.3 + pad * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(0, h - boxH, w, boxH);
      ctx.fillStyle = '#fff';
      lines.forEach((t, i) => ctx.fillText(t, pad, h - boxH + pad + fs * 1.25 * (i + 1) - fs * 0.2));

      const blob: Blob = await new Promise((res, rej) =>
        c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal membuat foto'))), 'image/jpeg', 0.85)
      );

      const clientId = crypto.randomUUID();
      await enqueue(
        'visual_reports',
        {
          client_id: clientId, user_id: userId,
          latitude: fix.lat, longitude: fix.lng, accuracy_m: fix.acc,
          captured_at: capturedAt.toISOString(),
        },
        { blob, bucket: 'visual-reports', field: 'photo_path' }
      );
      onSaved?.(clientId);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full" />
      </div>
      <p className={`text-sm font-medium ${gpsOk ? 'text-green-700' : 'text-amber-700'}`}>
        {!fix
          ? 'Mencari sinyal GPS…'
          : gpsOk
          ? `GPS siap (akurasi ±${Math.round(fix.acc)} m)`
          : `Akurasi GPS ±${Math.round(fix.acc)} m. Pindah ke area terbuka (maks ${maxAccuracyM} m).`}
      </p>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button
        onClick={capture}
        disabled={!stream || !gpsOk || busy}
        className="h-16 w-full rounded-xl bg-amber-500 text-lg font-bold text-black disabled:opacity-40"
      >
        {busy ? 'Menyimpan…' : 'Ambil foto'}
      </button>
    </div>
  );
}
