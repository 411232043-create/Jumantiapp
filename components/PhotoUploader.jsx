'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { MAX_FOTO_SIZE, FOTO_TYPES } from '@/lib/constants';
import { useToast } from './ui/Toast';

export function PhotoUploader({ fotos, onChange, uid }) {
  // fotos: [{file?, preview, url?, path?, nama_file}]
  const inputRef = useRef(null);
  const toast = useToast();

  const addFiles = (files) => {
    const next = [...fotos];
    for (const file of files) {
      if (!FOTO_TYPES.includes(file.type)) {
        toast.error(`${file.name}: hanya JPG/JPEG/PNG yang diperbolehkan.`);
        continue;
      }
      if (file.size > MAX_FOTO_SIZE) {
        toast.error(`${file.name}: ukuran maksimal 700 KB.`);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file), nama_file: file.name });
    }
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {fotos.map((f, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-emerald-500/30 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.preview || f.url} alt={f.nama_file || 'foto'} className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(fotos.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <X size={13} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-24 h-24 rounded-xl border-2 border-dashed border-emerald-500/35 flex flex-col items-center justify-center gap-1 text-muted hover:text-lime-300 hover:border-lime-400/60 transition">
          <Camera size={20} />
          <span className="text-[10px]">Tambah Foto</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" multiple className="hidden"
        onChange={(e) => { addFiles([...e.target.files]); e.target.value = ''; }} />
      <p className="text-[11px] text-muted mt-2">Format JPG/JPEG/PNG, maksimal 700 KB per foto.</p>
    </div>
  );
}
