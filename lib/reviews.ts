export interface CommunityReview {
  skuId: string;
  overallSentiment: 'VERY_POSITIVE' | 'POSITIVE' | 'BALANCED';
  pros: string[];
  cons: string[];
  thermals: string;
  noise: string;
  source: string;
}

export const COMMUNITY_REVIEWS: Record<string, CommunityReview> = {
  'gpu-rtx-4060-8g': {
    skuId: 'gpu-rtx-4060-8g',
    overallSentiment: 'POSITIVE',
    pros: [
      'Ăn cực ít điện (~115W full load), mát mẻ, không kén nguồn',
      'Hỗ trợ DLSS 3 Frame Generation nhân đôi FPS mượt mà',
    ],
    cons: ['Băng thông VRAM 128-bit hạn chế hiệu năng nếu kéo màn hình 2K/4K'],
    thermals: '~63°C trong phòng điều hòa 26°C',
    noise: 'Quạt êm, hầu như không nghe tiếng gió khi chơi game',
    source: 'Tổng hợp từ Voz Forums & Tinhte.vn',
  },
  'gpu-rtx-4070-super-12g': {
    skuId: 'gpu-rtx-4070-super-12g',
    overallSentiment: 'VERY_POSITIVE',
    pros: [
      'Hiệu năng 1440p cực mạnh, vượt trội RTX 3080 thế hệ trước',
      '12GB VRAM chuẩn GDDR6X thoải mái chiến game AAA đồ họa Max Setting',
    ],
    cons: ['Giá thành tại các chuỗi bán lẻ còn chênh lệch từ 500k - 1tr'],
    thermals: '~66°C khi render Ray Tracing nặng',
    noise: 'Quạt 2 fan tản nhiệt tốt, dưới 36 dBA',
    source: 'Voz Hardware Club & Reddit PCMasterRace VN',
  },
  'gpu-rx-6600-8g': {
    skuId: 'gpu-rx-6600-8g',
    overallSentiment: 'VERY_POSITIVE',
    pros: [
      'Vua hiệu năng trên giá thành (P/P) phân khúc dưới 6 triệu',
      'Tiêu thụ chỉ ~100W, nguồn 450W - 500W gánh vô tư',
    ],
    cons: ['Hiệu năng Ray Tracing yếu hơn dòng Nvidia tương đương'],
    thermals: '~62°C - 65°C',
    noise: 'Rất êm ái',
    source: 'Cộng đồng Game thủ AMD Việt Nam',
  },
  'gpu-rx-7700-xt-12g': {
    skuId: 'gpu-rx-7700-xt-12g',
    overallSentiment: 'POSITIVE',
    pros: [
      'Dung lượng 12GB VRAM rộng rãi, kéo game 2K cực mượt',
      'Hiệu năng thuần rasterization mạnh hơn RTX 4060 Ti đáng kể',
    ],
    cons: ['Tiêu thụ điện ~245W, cần nguồn từ 650W trở lên'],
    thermals: '~68°C khi chơi Cyberpunk 2077',
    noise: 'Tản nhiệt 2.5 khe dày, quạt quay tốc độ cao khi tải nặng',
    source: 'Voz Reviewer Lab',
  },
  'cpu-i5-12400f': {
    skuId: 'cpu-i5-12400f',
    overallSentiment: 'VERY_POSITIVE',
    pros: [
      'Giá siêu rẻ (~2.4tr), 6 nhân 12 luồng đủ sức gánh hầu hết game hiện nay',
      'TDP thấp, tản khí giá 200k là mát rượi',
    ],
    cons: ['Không hỗ trợ xung nhịp turbo cao như thế hệ Raptor Lake 13/14'],
    thermals: '~58°C với tản tháp 4 ống đồng',
    noise: 'Tản stock hơi ồn nếu tải nặng, nên mua thêm tản tháp',
    source: 'Voz Hardware Consensus',
  },
  'cpu-r5-5600': {
    skuId: 'cpu-r5-5600',
    overallSentiment: 'VERY_POSITIVE',
    pros: [
      'Bo mạch chủ AM4 giá cực rẻ, dễ kiếm linh kiện thay thế',
      'Bộ nhớ đệm L3 Cache 32MB tối ưu FPS game Esports (CS2, LoL, Valorant)',
    ],
    cons: ['Chuẩn socket AM4 đã ngưng ra vi kiến trúc mới'],
    thermals: '~62°C khi full load',
    noise: 'Tản stock kèm theo dùng tạm ổn',
    source: 'AMD Vietnam Community',
  },
  'cpu-r5-7500f': {
    skuId: 'cpu-r5-7500f',
    overallSentiment: 'VERY_POSITIVE',
    pros: [
      'Nền tảng AM5 DDR5 hiện đại, lộ trình nâng cấp CPU tới 2027+',
      'Đơn nhân kiến trúc Zen 4 cực mạnh, tối ưu khung hình tối đa',
    ],
    cons: ['Bắt buộc dùng RAM DDR5 giá cao hơn DDR4 khoảng 30%'],
    thermals: '~65°C - 70°C',
    noise: 'Quạt êm',
    source: 'Voz Overclocking Zone',
  },
};

export function getCommunityReview(skuId: string): CommunityReview | null {
  return COMMUNITY_REVIEWS[skuId] || null;
}
