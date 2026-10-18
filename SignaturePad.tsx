'use client';
import { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    ref.current!.setPointerCapture(e.pointerId);
    const ctx = ref.current!.getContext('2d')!;
    const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext('2d')!;
    const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false; setEmpty(false);
    onChange(ref.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const c = ref.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setEmpty(true); onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={ref}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="h-40 w-full rounded-xl border-2 border-dashed border-neutral-400 bg-white"
        style={{ touchAction: 'none' }}
        aria-label="Area tanda tangan"
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">{empty ? 'Tanda tangan di kotak di atas' : 'Tanda tangan tersimpan'}</span>
        <button type="button" onClick={clear} className="h-12 rounded-lg px-4 font-semibold underline">Hapus</button>
      </div>
    </div>
  );
}
