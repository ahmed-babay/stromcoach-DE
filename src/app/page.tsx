'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTomorrowPricesDELU, type HourPrice as QuarterPoint} from '@/lib/getTomorrowPrices';
import { aggregateToHours, type HourPoint } from '@/lib/aggregateToHours';
import { cheapestWindow } from '@/lib/cheapestWindow';

export default function Home() {
  const [day, setDay] = useState<string>('');
  const [quarters, setQuarters] = useState<QuarterPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple inputs (stored in localStorage)
  const [flatCt, setFlatCt] = useState<number>(() => 
    typeof window !== 'undefined' ? Number(localStorage.getItem('flatCt') ?? 30) : 30
  );
  const [duration, setDuration] = useState<number>(() => 
    typeof window !== 'undefined' ? Number(localStorage.getItem('duration') ?? 3) : 3
  );
  const [deadline, setDeadline] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem('deadline') ?? '07:00' : '07:00'
  );

  useEffect(() => {
    getTomorrowPricesDELU()
      .then(({ day, hours }) => { setDay(day); setQuarters(hours); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Persist inputs
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('flatCt', String(flatCt)); 
    }
  }, [flatCt]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('duration', String(duration)); 
    }
  }, [duration]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('deadline', deadline); 
    }
  }, [deadline]);

  // Derive hourly data
  const hourly: HourPoint[] = useMemo(() => quarters ? aggregateToHours(quarters) : [], [quarters]);

  // Compute cheapest window
  const plan = useMemo(() => {
    if (!hourly.length) return null;
    return cheapestWindow(hourly, Math.max(1, Math.floor(duration)), deadline);
  }, [hourly, duration, deadline]);

  // Compute savings vs flat
  const savings = useMemo(() => {
    if (!plan) return null;
    const flatAvg = flatCt; // ct/kWh
    const deltaCt = flatAvg - plan.avg_ct_per_kwh; // cents per kWh saved
    // Assume 1.6 kWh per hour as a neutral demo (you'll replace with per-device later)
    const assumedKwh = Math.max(1, Math.floor(duration)) * 1.0; // 1 kWh per hour for MVP
    const euro = (deltaCt / 100) * assumedKwh;
    return { deltaCt, euro };
  }, [plan, flatCt, duration]);

  if (loading) return <main className="p-6">Loading tomorrow’s prices…</main>;
  if ((error) && (error== "Error: Energy-Charts error 404: no content available"))  return <main className="p-6">There is no data for tomorrow yet. Please try again later.</main>;
  else if (error)  return <main className="p-6 text-red-600">Failed: {error}</main>;
  if (!quarters?.length)  return <main className="p-6">No data.</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">StromCoach DE</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Planner inputs</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            Flat price (ct/kWh)
            <input
              className="border rounded p-2 ml-2 w-24"
              type="number"
              value={flatCt}
              onChange={(e)=>setFlatCt(Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Duration (hours)
            <input
              className="border rounded p-2 ml-2 w-20"
              type="number"
              value={duration}
              min={1}
              onChange={(e)=>setDuration(Number(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Latest finish (HH:mm)
            <input
              className="border rounded p-2 ml-2 w-28"
              type="time"
              value={deadline}
              onChange={(e)=>setDeadline(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cheapest window for tomorrow ({day})</h2>
        {plan ? (
          <div className="border rounded p-3">
            <div>
              {String(plan.startHour).padStart(2,'0')}:00–{String(plan.endHour).padStart(2,'0')}:00 ·
              {' '}avg {plan.avg_ct_per_kwh.toFixed(2)} ct/kWh
            </div>
            {savings && (
              <div className="text-sm text-gray-600">
                vs flat {flatCt.toFixed(1)} ct/kWh → saves ~{savings.deltaCt.toFixed(2)} ct/kWh · ≈ €{savings.euro.toFixed(2)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No feasible window before {deadline}.</div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Hourly prices (ct/kWh)</h2>
        <ul className="grid grid-cols-2 gap-2">
          {hourly.map((h, i) => {
            const d = new Date(h.ts);
            const hh = d.getHours().toString().padStart(2,'0');
            return (
              <li key={i} className="border rounded p-2 text-sm">
                {hh}:00 → {h.ct_per_kwh.toFixed(2)} ct/kWh
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}