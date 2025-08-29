import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DynamicHtml from "./components/DynamicHtml";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Beam Calculator",
  description:
    "A structural engineering tool for computing support reactions, shear force diagrams (SFD), and bending moment diagrams (BMD) for simply supported and cantilever beams with point, UDL, and triangular loads.",
};

export default function RootLayout({ children }) {
  return (
    <DynamicHtml>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </DynamicHtml>
  );
}
