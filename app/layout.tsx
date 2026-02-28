import "./globals.css";

export const metadata = {
  title: "Itenora — AI Trip Planner",
  description: "Plan trips by destination, dates, budget, and travel style. Family-friendly, fast, and simple.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}