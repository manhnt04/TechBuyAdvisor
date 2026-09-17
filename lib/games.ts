export interface GameMeta {
  name: string;
  shortName: string;
  kind: 'AAA' | 'Esports';
  mark: string;
  steamAppId?: number;
  posterUrl: string;
  localPoster: string;
  fallbackColor: string;
  description: string;
  targetFps1080p: number;
  targetFps1440p: number;
}

export const GAME_CATALOG: GameMeta[] = [
  {
    name: 'Cyberpunk 2077',
    shortName: 'Cyberpunk',
    kind: 'AAA',
    mark: 'CP',
    steamAppId: 1091500,
    posterUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/capsule_616x353.jpg',
    localPoster: '/games/cyberpunk-2077.jpg',
    fallbackColor: '#fee2e2',
    description: 'Đồ họa Ray Tracing thế hệ mới, đòi hỏi GPU mạnh và VRAM lớn',
    targetFps1080p: 60,
    targetFps1440p: 60,
  },
  {
    name: 'Black Myth: Wukong',
    shortName: 'Wukong',
    kind: 'AAA',
    mark: 'BMW',
    steamAppId: 2358720,
    posterUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/capsule_616x353.jpg',
    localPoster: '/games/black-myth-wukong.jpg',
    fallbackColor: '#fef3c7',
    description: 'Unreal Engine 5 bom tấn 2024, tận dụng triệt để kiến trúc GPU hiện đại',
    targetFps1080p: 60,
    targetFps1440p: 60,
  },
  {
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    kind: 'Esports',
    mark: 'CS2',
    steamAppId: 730,
    posterUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/capsule_616x353.jpg',
    localPoster: '/games/counter-strike-2.jpg',
    fallbackColor: '#e0f2fe',
    description: 'Source 2 engine, yêu cầu đơn nhân CPU cao và độ trễ khung hình tối thiểu',
    targetFps1080p: 144,
    targetFps1440p: 144,
  },
  {
    name: 'Valorant',
    shortName: 'Valorant',
    kind: 'Esports',
    mark: 'VAL',
    posterUrl: 'https://images.igdb.com/igdb/image/upload/t_720p/co2mvt.jpg',
    localPoster: '/games/valorant.jpg',
    fallbackColor: '#ffe4e6',
    description: 'Bắn súng chiến thuật nhịp độ cao, tối ưu tối đa cho màn hình 144Hz - 240Hz',
    targetFps1080p: 144,
    targetFps1440p: 144,
  },
  {
    name: 'League of Legends',
    shortName: 'LoL',
    kind: 'Esports',
    mark: 'LOL',
    posterUrl: 'https://images.igdb.com/igdb/image/upload/t_720p/co49x5.jpg',
    localPoster: '/games/league-of-legends.jpg',
    fallbackColor: '#ecfdf5',
    description: 'Game MOBA quốc dân, vận hành mượt mà trên mọi cấu hình tiêu chuẩn',
    targetFps1080p: 144,
    targetFps1440p: 144,
  },
];
