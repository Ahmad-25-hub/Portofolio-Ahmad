import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import TransitionProvider from "@/components/providers/TransitionProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/ui/Cursor";
import Preloader from "@/components/ui/Preloader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Ahmad — Software Engineer & Web Developer",
    template: "%s — Ahmad",
  },
  description:
    "Portfolio of Ahmad, a Jakarta-based software engineer and web developer building AI-integrated web applications and production websites.",
  keywords: ["Ahmad", "Software Engineer", "Web Developer", "Next.js", "Laravel", "Jakarta", "Portfolio"],
  authors: [{ name: "Ahmad" }],
  openGraph: {
    title: "Ahmad — Software Engineer & Web Developer",
    description: "AI-integrated web applications and production websites, built in Jakarta.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body>
        <noscript>
          <style>{`.preloader{display:none!important}`}</style>
        </noscript>
        <SmoothScroll>
          <TransitionProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </TransitionProvider>
        </SmoothScroll>
        <Cursor />
        <Preloader />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
