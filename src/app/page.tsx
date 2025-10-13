'use client';

import { useEffect, useState } from 'react';
import { getTomorrowPricesDELU, type HourPrice } from '@/lib/getTomorrowPrices';

export default function Home() {
  const [day, setDay] = useState<string>('');
  const [hours, setHours] = useState<HourPrice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTomorrowPricesDELU()
      .then(({ day, hours }) => { setDay(day); setHours(hours); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-6">Loading tomorrow’s prices…</main>;
  if ((error) && (error== "Error: Energy-Charts error 404: no content available"))  return <main className="p-6">There is no data for tomorrow yet. Please try again later.</main>;
  else if (error)  return <main className="p-6 text-red-600">Failed: {error}</main>;
  if (!hours)  return <main className="p-6">No data.</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">StromCoach DE</h1>
      <p>Tomorrow ({day}) — DE-LU hourly prices (ct/kWh)</p>
      <ul className="grid grid-cols-2 gap-2">
        {hours.map((h, i) => {
          const hour = new Date(h.ts).getHours().toString().padStart(2, '0');
          const remainder = i % 4;
          const suffix = remainder === 0 ? '00' : remainder === 1 ? '15' : remainder === 2 ? '30' : '45';
          return (
            <li key={i} className="border rounded p-2 text-sm">
              {hour}:{suffix} → {h.ct_per_kwh.toFixed(2)} ct/kWh
            </li>
          );
        })}
      </ul>
    </main>
  );
}