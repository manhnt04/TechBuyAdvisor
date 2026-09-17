import { NextRequest, NextResponse } from 'next/server';
import { validateQuoteImage } from '@/lib/quote-validator';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      base64Data = body.image || '';
      mimeType = body.mimeType || 'image/jpeg';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy file ảnh tải lên' }, { status: 400 });
      }
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      return NextResponse.json({ error: 'Định dạng dữ liệu không hợp lệ' }, { status: 400 });
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Dữ liệu ảnh trống' }, { status: 400 });
    }

    const result = await validateQuoteImage(base64Data, mimeType);
    return NextResponse.json({ status: 'OK', result });
  } catch (err: any) {
    console.error('[QUOTE VALIDATOR ERROR]', err);
    return NextResponse.json({ status: 'ERROR', message: err?.message || 'Lỗi xử lý ảnh báo giá' }, { status: 500 });
  }
}
