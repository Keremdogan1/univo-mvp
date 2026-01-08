import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MetuVerificationGuard from "@/components/auth/MetuVerificationGuard";
import GlobalSearch from "@/components/search/GlobalSearch";

export const metadata: Metadata = {
  title: "Univo - University Events & Announcements",
  description: "Your central hub for university events, announcements, and campus news. Stay connected with your campus community.",
  icons: {
    icon: '/univo-logo-transparent.png?v=5',
    apple: '/univo-logo-transparent.png?v=5',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
                
                // Defensive cleanup for rogue extension/overlay
                const cleanup = () => {
                    const rogueId = document.getElementById('preact-border-shadow-host');
                    if (rogueId) rogueId.remove();
                    
                    const rogueClass = document.querySelector('.animate-breathing');
                    if (rogueClass) rogueClass.remove();
                };
                
                const observer = new MutationObserver(cleanup);
                observer.observe(document.documentElement, { childList: true, subtree: true });
                
                window.addEventListener('load', cleanup);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <MetuVerificationGuard>
              <Header />
              <GlobalSearch />
              <main className="flex-1 bg-white dark:bg-[#0a0a0a] transition-colors duration-300 pb-20 md:pb-0">
                <Toaster
                  position="top-center"
                  richColors
                  toastOptions={{
                    style: {
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      borderRadius: '12px',
                      border: '1px solid #e5e5e5',
                    },
                  }}
                />
                {children}
              </main>
              <Footer />
              <ScrollToTopButton />
            </MetuVerificationGuard>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
