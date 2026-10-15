import { useCallback, useEffect, useState } from 'react';
import { getInicio, type InicioData } from '../services/inicio.service';

export function useInicio() {
  const [data, setData] = useState<InicioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getInicio());
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el inicio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
