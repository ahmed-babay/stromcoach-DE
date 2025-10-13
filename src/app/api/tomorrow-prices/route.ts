import { NextResponse } from 'next/server';

function getBerlinTomorrowISO(base = new Date()) {
  // Get UTC time and convert to Berlin timezone offset (+1 or +2 depending on DST)
  const utcDate = new Date(base);
  
  // Create a date formatter for Berlin timezone
  const berlinDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  
  // Add one day for tomorrow
  berlinDate.setDate(berlinDate.getDate()+1);
  
  const yyyy = berlinDate.getFullYear();
  const mm = String(berlinDate.getMonth()+1).padStart(2, '0');
  const dd = String(berlinDate.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const day = getBerlinTomorrowISO();
    const url = `https://api.energy-charts.info/price?bzn=DE-LU&start=${day}&end=${day}`;
    
    console.log('Fetching prices for date:', day);
    console.log('Full URL:', url);
    
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'StromCoach/1.0'
      }
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        { error: `Energy-Charts error ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }
    
    const data = await res.json() as { unix_seconds: number[]; price: number[] };
    
    console.log('Data received:', data.unix_seconds?.length || 0, 'hours');
    
    const hours = data.unix_seconds.map((unix, i) => ({
      ts: unix * 1000,                // ms since epoch
      ct_per_kwh: data.price[i] / 10, // €/MWh -> ct/kWh
    }));
    
    return NextResponse.json({ day, hours });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch prices: ${error}` },
      { status: 500 }
    );
  }
}

