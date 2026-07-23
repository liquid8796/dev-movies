import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Pacifico } from "next/font/google";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const pacifico = Pacifico({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Xem phim lẻ, phim bộ mới nhất với chất lượng 4K. Kho phim khổng lồ, cập nhật liên tục, xem miễn phí tốc độ cao.",
};

export const viewport: Viewport = {
  themeColor: "#060b16",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? "", email: session.user.email ?? "" }
    : null;

  return (
    <html lang="vi" className={`${beVietnam.variable} ${pacifico.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
