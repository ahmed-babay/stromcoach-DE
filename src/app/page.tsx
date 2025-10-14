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

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Loading tomorrow's prices…</p>
      </div>
    </main>
  );
  
  if ((error) && (error== "Error: Energy-Charts error 404: no content available")) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Data Available</h1>
          <p className="text-gray-600">There is no data for tomorrow yet. Please try again later.</p>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Error</h1>
          <p className="text-red-600">Failed: {error}</p>
        </div>
      </main>
    );
  }
  
  if (!quarters?.length) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Data</h1>
          <p className="text-gray-600">No electricity price data available.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            StromCoach DE ⚡
          </h1>
          <p className="text-gray-600 text-lg">Find the cheapest time to run your appliances</p>
        </div>

        {/* Planner Inputs Card */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">⚙️</span>
            <h2 className="text-xl font-semibold text-gray-800">Planner Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                💰 Flat price (ct/kWh)
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                type="number"
                value={flatCt}
                onChange={(e)=>setFlatCt(Number(e.target.value))}
                placeholder="30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ⏱️ Duration (hours)
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                type="number"
                value={duration}
                min={1}
                onChange={(e)=>setDuration(Number(e.target.value))}
                placeholder="3"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🕐 Latest finish (HH:mm)
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                type="time"
                value={deadline}
                onChange={(e)=>setDeadline(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Results Card */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🎯</span>
            <h2 className="text-xl font-semibold text-gray-800">
              Cheapest Window for Tomorrow ({day})
            </h2>
          </div>
          
          {plan ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {String(plan.startHour).padStart(2,'0')}:00 – {String(plan.endHour).padStart(2,'0')}:00
                  </div>
                  <div className="text-lg text-green-600">
                    Average: {plan.avg_ct_per_kwh.toFixed(2)} ct/kWh
                  </div>
                </div>
                <div className="text-4xl">💡</div>
              </div>
              
              {savings && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Savings vs flat rate:</div>
                      <div className="text-lg font-semibold text-green-700">
                        ~{savings.deltaCt.toFixed(2)} ct/kWh
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Total savings:</div>
                      <div className="text-2xl font-bold text-green-600">
                        €{savings.euro.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <div className="text-yellow-700 font-medium">
                No feasible window before {deadline}
              </div>
              <div className="text-yellow-600 text-sm mt-1">
                Try adjusting your duration or deadline
              </div>
            </div>
          )}
        </section>

        {/* Hourly Prices Card */}
        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-3">📊</span>
            <h2 className="text-xl font-semibold text-gray-800">Hourly Prices (ct/kWh)</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {hourly.map((h, i) => {
              const d = new Date(h.ts);
              const hh = d.getHours().toString().padStart(2,'0');
              const isLowPrice = h.ct_per_kwh < (hourly.reduce((sum, hour) => sum + hour.ct_per_kwh, 0) / hourly.length);
              const isPlanWindow = plan && h.ts >= plan.startTs && h.ts <= plan.endTs;
              
              return (
                <div 
                  key={i} 
                  className={`
                    rounded-lg p-3 text-center transition-all hover:scale-105 cursor-pointer
                    ${isPlanWindow 
                      ? 'bg-green-100 border-2 border-green-400 shadow-lg' 
                      : isLowPrice 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }
                  `}
                >
                  <div className={`font-medium ${isPlanWindow ? 'text-green-700' : 'text-gray-700'}`}>
                    {hh}:00
                  </div>
                  <div className={`text-sm ${isPlanWindow ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                    {h.ct_per_kwh.toFixed(2)} ct
                  </div>
                  {isPlanWindow && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      💡 Optimal
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}