import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rent a Web | Profesionalne Web Stranice",
  description: "Najbrži način da dođete do moderne i funkcionalne web stranice. Unajmite web stranicu za samo 39€/mjesečno.",
  keywords: ["web dizajn", "cijena web stranica", "najam weba", "automatizacija salesa"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png",
    shortcut: "https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png",
    apple: "https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png",
  },
  openGraph: {
    title: "Rent a Web | Profesionalne Web Stranice",
    description: "Moderni web dizajn i automatizirani prodajni sustavi za vaš biznis.",
    url: "/",
    siteName: "Rent a Web",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rent a Web Preview",
      },
    ],
    locale: "hr_HR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent a Web",
    description: "Moderne web stranice za moderni biznis.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
