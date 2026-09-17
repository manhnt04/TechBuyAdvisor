import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechBuy Advisor — Chọn PC gaming tự tin hơn',
  description: 'Khám phá cấu hình PC gaming theo ngân sách, game và độ phân giải. Quyết định minh bạch, dễ kiểm chứng.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
