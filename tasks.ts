'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './sync';

export type Task = { id: string; title: string; unit: string; target_volume: number; actual_volume: number; status: 'todo' | 'doing' | 'done' | 'blocked' };
export type Eq = { id: string; code: string; name: string };
export const today = () => new Date().toLocaleDateString('sv-SE');

function useCached<T>(key: string, fetcher: () => PromiseLike<{ data: any }>) {
  const [data, setData] = useState<T[]>([]);
  const reload = useCallback(() => {
    const c = localStorage.getItem(key);
    if (c) setData(JSON.parse(c));
    if (navigator.onLine) fetcher().then(({ data: d }) => { if (d) { setData(d); localStorage.setItem(key, JSON.stringify(d)); } });
  }, [key]); // eslint-disable-line
  useEffect(reload, [reload]);
  return [data, reload] as const;
}

export const useTasks = () => useCached<Task>('prodhse:tasks', () =>
  supabase.from('production_tasks').select('id,title,unit,target_volume,actual_volume,status').order('updated_at', { ascending: false }));
export const useEquipmentList = () => useCached<Eq>('prodhse:equipment', () =>
  supabase.from('equipment').select('id,code,name,hour_meter').order('code'));
