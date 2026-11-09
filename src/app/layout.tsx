import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CashPilot",
  description: "בודקים את התלוש ומוצאים כסף שמגיע לך",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before paint so dark mode never flashes light first.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-bg">{children}</div>
      </body>
    </html>
  );
}
