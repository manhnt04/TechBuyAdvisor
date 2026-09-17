import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './result.css';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'TechBuy Advisor — Chọn PC gaming tự tin hơn',
  description: 'Khám phá cấu hình PC gaming theo ngân sách, game và độ phân giải. Quyết định minh bạch, dễ kiểm chứng.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className={beVietnamPro.className}>{children}</body>
    </html>
  );
}
