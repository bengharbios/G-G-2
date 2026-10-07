import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ألعاب الغريب — منصة ألعاب جماعية عربية",
  description: "منصة ألعاب اجتماعية وحربية عربية. العب مع أصحابك في نفس الوقت من أي مكان - بدون تسجيل، بدون تطبيق.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A6B5E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GGames" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Critical: Force-clear stale Service Worker + caches before any JS loads.
            This breaks the old-SW-caching-old-JS cycle. The old SW's networkFirst
            strategy fetches HTML from network first, so this fresh script WILL execute. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem("sw-clr-v5"))return;if("serviceWorker"in navigator){navigator.serviceWorker.getRegistrations().then(function(r){return Promise.all(r.map(function(x){return x.unregister()}))}).then(function(){if("caches"in window){return caches.keys().then(function(k){return Promise.all(k.map(function(c){return caches.delete(c)}))})}}).then(function(){sessionStorage.setItem("sw-clr-v5","1")}).catch(function(){})}}catch(e){}})();`,
          }}
        />
        {/* وضع التضمين: داخل إطار يلا لودو نخفي هيدر اللعبة ونبلّغ الأصل بالجواهر */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.self!==window.top){document.documentElement.classList.add("gg-embedded");window.addEventListener("message",function(e){if(e&&e.data&&e.data.type==="yalla:hello"){document.documentElement.classList.add("gg-embedded")}});setInterval(function(){var m=document.querySelector("[class*=gem],[class*=Gems],[class*=gems]");var t=m?(m.textContent||"").match(/\\d+[\\d,]*/):null;parent.postMessage({type:"gg:gems",value:t?parseInt(t[0].replace(/,/g,""),10):null},"*")},3000)}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
