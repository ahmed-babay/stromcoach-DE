
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold">StromCoach DE</h1>
      <p className="text-gray-500">
        Your personal energy-price planner for Germany.
      </p>
      <p>
        We’ll fetch tomorrow’s hourly electricity prices and show the cheapest
        hours to run your appliances.
      </p>
    </main>
  );
}