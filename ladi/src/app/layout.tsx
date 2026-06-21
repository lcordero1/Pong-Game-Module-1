import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Nav from "@/components/Nav";
import OfflineBanner from "@/components/OfflineBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Ladi",
  description: "Your busy-body project organizer",
  appleWebApp: {
    capable: true,
    title: "Ladi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1815" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint to prevent a light-mode flash on dark-mode loads.
const themeBoot = `
(function(){try{var t=localStorage.getItem('ladi-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
      </head>
      <body>
        <OfflineBanner />
        <div className="min-h-screen pb-20 sm:pb-0">
          <Nav />
          <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
