import { useCallback, useEffect, useState } from 'react';
import { getResumen, type PeriodoTipo, type ResumenData } from '../services/reports.service';

const pad = (n: number) => String(n).padStart(2, '0');
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Resumen de un período; `shift(±1)` navega al período anterior/siguiente */
export function useResumen() {
  const [tipo, setTipo] = useState<PeriodoTipo>('semana');
  const [fecha, setFecha] = useState(() => toYmd(new Date()));
  const [data, setData] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getResumen(tipo, fecha));
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el resumen');
    } finally {
      setLoading(false);
    }
  }, [tipo, fecha]);

  useEffect(() => {
    load();
  }, [load]);

  const shift = (dir: 1 | -1) => {
    const d = fromYmd(fecha);
    if (tipo === 'semana') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir, 1);
    setFecha(toYmd(d));
  };

  return { tipo, setTipo, fecha, goToday: () => setFecha(toYmd(new Date())), shift, data, loading, error, reload: load };
}
