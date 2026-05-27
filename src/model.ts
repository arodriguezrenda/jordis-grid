const thumbnailSize = '240';

export interface LiveVideo {
  videoId: string;
  title: string;
}

export interface Channel {
  channelId: string;
  title: string;
  thumbnail?: string;
  liveVideos: LiveVideo[];
}

export interface LiveVideoOption {
  videoId: string;
  channelId: string;
  channelTitle: string;
  videoTitle: string;
  label: string;
}

export type VideoHealthStatus = 'Live' | 'Delayed' | 'Stalled' | 'Reconnecting';

export const initialChannels: Channel[] = [
  {
    channelId: 'UCba3hpU7EFBSk817y9qZkiA',
    title: 'LA NACION',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/ytc/AIdro_kqtZB_6WG36RuIrX7Npa_XgoeV-KK74HcQ7m9xWQcKI7E=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UCj6PcyLvpnIRT_2W_mwa9Aw',
    title: 'Todo Noticias',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/OL0n5KS1Yw3200B8OhLyq6Qa_g-aNGhJcuhNQJ2Ym3Ykan1Bptx1_yJrClMlMedhLR_W4cvoOw=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UCC1kfsMJko54AqxtcFECt-A',
    title: 'Urbana Play 104.3 FM',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/FJNJoYpkJJJZ7eQp0nh5X8Ub5XN6Jy4xUCp3OrEiNRoSVb2eSeUxWgW1byhimytcybcM_wB8-yk=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UCvCTWHCbBC0b9UIeLeNs8ug',
    title: 'Vorterix',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/MLwjpG_fQdT6e-8_CNsqcOSKghc58Q_xGoZMn5lp37fGCUUqh3PoW5L3-XUB093Iv9Ozt4C9NgU=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UCTHaNTsP7hsVgBxARZTuajw',
    title: 'LUZU TV',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/1-K9ikW6iP0nnfCVhcCnH2MpGSWVUee1DUL4Y8-8i_xwa-JKAv-9GEs1OKAl8ddpXMaFxOyB=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UC7mJ2EDXFomeDIRFu5FtEbA',
    title: 'OLGA',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/D4kn5IQBl9r2r-B03hGiUKXtO1xq59lh5F1ARe5UnngDI3TH3LIW6liz2nidzy8NAhKW-wucig=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UC-rI_XNppHJO-Ga4RW_CDKw',
    title: 'El Observador 107.9',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/MmlOtGwNdzp-2FlnS4Zk8aCd1JCVlzPo-57bkvRkoywzGmxXaLWSazItM8dkVa7TEAAGkgOQug=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
  {
    channelId: 'UCT7KFGv6s2a-rh2Jq8ZdM1g',
    title: 'Crónica TV',
    liveVideos: [],
    thumbnail: `https://yt3.ggpht.com/EGyrGJo_3mJxohmZxkP0Ksma9r1J1fU1ORZkGkwJkGJKRyeu6aHTD_Zi-4AodbD0hLRnTzoCWA=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`,
  },
];
