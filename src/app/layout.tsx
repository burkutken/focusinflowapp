
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "focusinflow",
  description: "Organize your tasks and focus with the Pomodoro technique and let AI assist your tasks.",
  metadataBase: new URL('https://focusinflow.com'),
  alternates: {
    canonical: '/',
  },
};

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 8.68"><defs><style>.cls-1{fill:#f3b995;}.cls-2{fill:#f8f1dd;}.cls-3{font-size:1.91px;fill:#3b3b4a;font-family:Montserrat-SemiBold, Montserrat;font-weight:600;}.cls-4{letter-spacing:-0.01em;}.cls-5{letter-spacing:-0.01em;}</style></defs><g id="Layer_3" data-name="Layer 3"><path class="cls-1" d="M8.36,4.78A11,11,0,0,1,6.7,4.33,8.82,8.82,0,0,0,4.93,4,4.64,4.64,0,0,0,1.48,5.2a1.27,1.27,0,0,0-.38.54c-.06.2,0,.41-.07.61C1,6.8.61,7.15.49,7.58a1.74,1.74,0,0,0,.06,1,3.08,3.08,0,0,0,1.37,1.72c.62.36,1.34.49,2,.86.38.23.7.55,1.07.8a1.78,1.78,0,0,0,1.25.35c.59-.1,1-.64,1.52-.94a3.19,3.19,0,0,1,2-.25,15.16,15.16,0,0,0,2,.27,2.34,2.34,0,0,0,.69-.09,4.53,4.53,0,0,0,.6-.26c.55-.24,1.14-.34,1.69-.56a2.05,2.05,0,0,0,1.26-1.18,2.68,2.68,0,0,0-.1-1.4l-.57-2.27A1,1,0,0,0,15,5.11c-.19-.16-.47-.15-.71-.25-.5-.2-.7-.84-1.18-1.09s-1.26.07-1.84.35a5.54,5.54,0,0,1-2.92.66" transform="translate(0 -3.66)"/><path class="cls-2" d="M7.92,4.78a11,11,0,0,1-1.66-.45A8.87,8.87,0,0,0,4.5,4,4.64,4.64,0,0,0,1,5.2a1.27,1.27,0,0,0-.38.54c-.06.2,0,.41-.07.61-.07.45-.42.8-.54,1.23a1.74,1.74,0,0,0,.06,1,3.08,3.08,0,0,0,1.37,1.72c.62.36,1.34.49,2,.86.38.23.71.55,1.07.8a1.79,1.79,0,0,0,1.25.35c.59-.1,1-.64,1.52-.94a3.19,3.19,0,0,1,2-.25,15.16,15.16,0,0,0,2,.27,2.3,2.3,0,0,0,.69-.09,4.53,4.53,0,0,0,.6-.26c.55-.24,1.14-.34,1.69-.56A2.05,2.05,0,0,0,15.5,9.31a2.68,2.68,0,0,0-.1-1.4l-.57-2.27a1,1,0,0,0-.26-.53c-.19-.16-.47-.15-.71-.25-.5-.2-.7-.84-1.18-1.09s-1.26.07-1.84.35a5.52,5.52,0,0,1-2.92.66" transform="translate(0 -3.66)"/></g><g id="Layer_2" data-name="Layer 2"><text class="cls-3" transform="translate(2.64 4.87)"><tspan class="cls-4">f</tspan><tspan x="0.69" y="0">ocusinfl</tspan><tspan class="cls-5" x="8.45" y="0">o</tspan><tspan x="9.65" y="0">w</tspan></text></g></svg>`;
const faviconDataUrl = `data:image/svg+xml;base64,${btoa(faviconSvg)}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" />
        <meta name="google-adsense-account" content="ca-pub-7287803953590654" />
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7287803953590654" crossOrigin="anonymous" />
        <link rel="icon" href={faviconDataUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background antialiased">
         <ThemeProvider
            attribute="class"
            defaultTheme="light"
            themes={['light', 'dark', 'theme-serene', 'theme-forest', 'theme-focus']}
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
