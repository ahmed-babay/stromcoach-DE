import './globals.css';

export const metadata = {
  title: 'StromCoach DE',
  description: 'Plan Germany’s cheapest electricity hours (MVP)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}