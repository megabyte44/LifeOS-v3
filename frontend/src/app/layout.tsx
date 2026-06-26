
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: {
    default: 'SmartLifeOS - Personal Life Management System',
    template: '%s | SmartLifeOS'
  },
  description: 'All-in-one personal productivity app. Manage habits, track expenses, organize notes, set goals, and monitor your daily activities. Built for efficiency and offline-first experience.',
  keywords: ['productivity', 'habit tracker', 'expense tracker', 'notes app', 'goal tracker', 'life management', 'personal organizer', 'PWA', 'offline app'],
  authors: [{ name: 'aiuser-cmd' }],
  creator: 'aiuser-cmd',
  publisher: 'SmartLifeOS',
  manifest: '/manifest.json',
  metadataBase: new URL('https://smartlifeos.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartlifeos.app',
    title: 'SmartLifeOS - Personal Life Management System',
    description: 'All-in-one personal productivity app. Manage habits, track expenses, organize notes, set goals, and monitor your daily activities.',
    siteName: 'SmartLifeOS',
    images: [
      {
        url: '/favicon.jpeg',
        width: 512,
        height: 512,
        alt: 'SmartLifeOS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartLifeOS - Personal Life Management System',
    description: 'All-in-one personal productivity app for managing your daily life.',
    images: ['/favicon.jpeg'],
    creator: '@aiusercmd',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.jpeg',
    shortcut: '/favicon.jpeg',
    apple: '/favicon.jpeg',
  },
  applicationName: 'SmartLifeOS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartLifeOS',
  },
};

const ThemeInitializer = () => {
  const script = `
    (function() {
      const theme = localStorage.getItem('theme');
      // Default to light mode if no preference is set
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        if (!theme) {
          localStorage.setItem('theme', 'light');
        }
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8a7ff2" />
        <link rel="icon" href="/favicon.jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.jpeg" />
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Splash Screens */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash-screen.jpeg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <ThemeInitializer />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
