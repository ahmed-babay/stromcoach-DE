export type HourPrice = { ts: number; ct_per_kwh: number };

export async function getTomorrowPricesDELU(): Promise<{ day: string; hours: HourPrice[] }> {
  // Call our Next.js API route instead of the external API directly
  // This avoids CORS issues since the API route runs on the server
  const res = await fetch('/api/tomorrow-prices', { cache: 'no-store' });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }
  
  const data = await res.json() as { day: string; hours: HourPrice[] };
  return data;
}