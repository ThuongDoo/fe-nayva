/**
 * Icons for icon buttons: 24×24 outline drawings (stroke = the icon colour), shared by the editor and
 * published pages. `svg` is the inner markup of an <svg viewBox="0 0 24 24">. Constants only, never
 * user input, so they can be injected as HTML. `filled: true` marks a solid drawing painted with the icon
 * colour as a fill (no stroke, so no stroke width); `{id}` in its markup becomes an id unique to the icon.
 */
import { svgGradientDef, svgPaint } from './gradient.js'

export const ICON_LIBRARY = {
  // Social networks
  facebook: { label: 'Facebook', group: 'social', svg: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>' },
  instagram: {
    label: 'Instagram',
    group: 'social',
    svg: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  },
  youtube: {
    label: 'YouTube',
    group: 'social',
    svg:
      '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  },
  tiktok: { label: 'TikTok', group: 'social', svg: '<path d="M16 3v11.5a4.5 4.5 0 1 1-4.5-4.5"/><path d="M16 3c.6 2.6 2.4 4.2 5 4.5"/>' },
  x: { label: 'X (Twitter)', group: 'social', svg: '<path d="M4 4l16 16M20 4 4 20"/>' },
  zalo: {
    label: 'Zalo',
    group: 'social',
    svg: '<path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.5L5 21l3.6-1.7c1.1.3 2.2.5 3.4.5 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/><path d="M8 9h5l-5 5h5M16 9v5"/>',
  },
  // Threads' "@"-like mark: an open outer loop that curls into the inner ring.
  threads: {
    label: 'Threads',
    group: 'social',
    svg: '<path d="M17.7 7.2A7.4 7.4 0 1 0 19.3 13.3c.3-3-1.9-4-4.8-3.8-3.5.2-5.7 1.4-5.6 3.3.1 1.7 1.7 2.5 3.3 2.3 2.2-.3 3-2.3 2.8-4.3-.1-1.2-.4-2-.9-2.6"/>',
  },
  // The app's logo in one colour: the tile in the icon colour, the speech bubble cut out (the button's
  // background shows through) with "Zalo" inside it. Blue #0068FF on white gives the real logo.
  zaloApp: {
    label: 'Zalo (logo ứng dụng)',
    group: 'social',
    filled: true,
    svg:
      '<mask id="{id}-m">' +
      '<rect x="1" y="1" width="22" height="22" rx="5.5" fill="#fff"/>' +
      '<rect x="3.6" y="5.2" width="16.8" height="11.2" rx="5.6" fill="#000"/>' +
      '<path d="M6.4 15.2 4.9 19.3l4.6-2.9z" fill="#000"/>' +
      '<text x="12" y="13.1" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="6.1" font-weight="700" fill="#fff">Zalo</text>' +
      '</mask>' +
      '<rect x="1" y="1" width="22" height="22" rx="5.5" mask="url(#{id}-m)"/>',
  },
  messenger: {
    label: 'Messenger',
    group: 'social',
    svg: '<path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.4 3.7 7.1V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2z"/><path d="m6.5 13.5 3.5-3.7 2.4 2 3.6-3.8"/>',
  },
  whatsapp: {
    label: 'WhatsApp',
    group: 'social',
    svg: '<path d="M3 21l1.7-4.6A9 9 0 1 1 7.6 19.4z"/><path d="M9 9.5c.3 2.6 2.5 4.8 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>',
  },
  telegram: { label: 'Telegram', group: 'social', svg: '<path d="m21.5 3.5-19 7.3 6.2 2.4L19 6.5 10.5 14l.2 6 3.3-3.8 4.6 3.3z"/>' },
  pinterest: {
    label: 'Pinterest',
    group: 'social',
    svg: '<circle cx="12" cy="12" r="10"/><path d="m10.5 21 2-8.5"/><path d="M9.3 14.3A4 4 0 1 1 13 16c-1.2 0-2-.6-2.3-1.2"/>',
  },
  github: {
    label: 'GitHub',
    group: 'social',
    svg: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5a13.4 13.4 0 0 0-8 0C6 2 5 2 5 2c-.3 1.2-.3 2.4 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1.1-.9 1.7-.2.6-.2 1.2-.1 1.8v4"/><path d="M9 18c-4.5 2-5-2-7-2"/>',
  },
  linkedin: {
    label: 'LinkedIn',
    group: 'social',
    svg: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  },
  // Contact
  phone: {
    label: 'Điện thoại',
    group: 'contact',
    svg:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/>',
  },
  mail: { label: 'Email', group: 'contact', svg: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>' },
  message: { label: 'Tin nhắn', group: 'contact', svg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>' },
  send: { label: 'Gửi', group: 'contact', svg: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>' },
  mapPin: { label: 'Địa chỉ', group: 'contact', svg: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>' },
  globe: {
    label: 'Website',
    group: 'contact',
    svg: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  },
  link: {
    label: 'Liên kết',
    group: 'contact',
    svg: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  },
  smartphone: { label: 'Di động', group: 'contact', svg: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>' },
  support: {
    label: 'Hỗ trợ',
    group: 'contact',
    svg: '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
  },
  at: { label: 'Email @', group: 'contact', svg: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>' },
  navigation: { label: 'Chỉ đường', group: 'contact', svg: '<path d="M3 11 22 2l-9 19-2-8z"/>' },
  map: {
    label: 'Bản đồ',
    group: 'contact',
    svg: '<path d="M14.1 5.1 9.9 2.9a2 2 0 0 0-1.8 0L3.6 5.2A1 1 0 0 0 3 6.1V20a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V4a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0z"/><path d="M9 3v15M15 6v15"/>',
  },
  idCard: {
    label: 'Danh thiếp',
    group: 'contact',
    svg: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M6 16h6"/>',
  },
  qr: {
    label: 'Mã QR',
    group: 'contact',
    svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  },
  // General
  cart: {
    label: 'Giỏ hàng',
    group: 'general',
    svg: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 1.9-1.6L22 7H5.1"/>',
  },
  heart: {
    label: 'Yêu thích',
    group: 'general',
    svg: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  },
  star: { label: 'Ngôi sao', group: 'general', svg: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>' },
  home: { label: 'Trang chủ', group: 'general', svg: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>' },
  user: { label: 'Tài khoản', group: 'general', svg: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  calendar: { label: 'Lịch', group: 'general', svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
  clock: { label: 'Giờ', group: 'general', svg: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
  search: { label: 'Tìm kiếm', group: 'general', svg: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' },
  download: { label: 'Tải về', group: 'general', svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>' },
  play: { label: 'Phát', group: 'general', svg: '<path d="M6 3l14 9-14 9z"/>' },
  music: { label: 'Âm nhạc', group: 'general', svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  camera: {
    label: 'Máy ảnh',
    group: 'general',
    svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  },
  gift: {
    label: 'Quà tặng',
    group: 'general',
    svg: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  },
  info: { label: 'Thông tin', group: 'general', svg: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>' },
  check: { label: 'Đồng ý', group: 'general', svg: '<path d="M20 6 9 17l-5-5"/>' },
  bell: { label: 'Thông báo', group: 'general', svg: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>' },
  bookmark: { label: 'Đánh dấu', group: 'general', svg: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
  thumbsUp: {
    label: 'Thích',
    group: 'general',
    svg: '<path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z"/>',
  },
  smile: { label: 'Mặt cười', group: 'general', svg: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>' },
  share: {
    label: 'Chia sẻ',
    group: 'general',
    svg: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  },
  eye: { label: 'Xem', group: 'general', svg: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' },
  lock: { label: 'Khoá', group: 'general', svg: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
  file: {
    label: 'Tài liệu',
    group: 'general',
    svg: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
  },
  menu: { label: 'Danh mục', group: 'general', svg: '<path d="M4 6h16M4 12h16M4 18h16"/>' },
  plus: { label: 'Thêm', group: 'general', svg: '<path d="M12 5v14M5 12h14"/>' },
  close: { label: 'Đóng', group: 'general', svg: '<path d="M18 6 6 18M6 6l12 12"/>' },
  help: { label: 'Hỏi đáp', group: 'general', svg: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>' },
  alert: {
    label: 'Cảnh báo',
    group: 'general',
    svg: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  },
  zap: { label: 'Tia chớp', group: 'general', svg: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>' },
  sparkles: { label: 'Lấp lánh', group: 'general', svg: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4"/>' },

  // Shopping & business
  bag: { label: 'Túi mua sắm', group: 'shop', svg: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>' },
  store: {
    label: 'Cửa hàng',
    group: 'shop',
    svg: '<path d="M3 9 4.5 3h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8M10 21v-5h4v5"/>',
  },
  tag: {
    label: 'Giá',
    group: 'shop',
    svg: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><path d="M7.5 7.5h.01"/>',
  },
  percent: { label: 'Giảm giá', group: 'shop', svg: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>' },
  creditCard: { label: 'Thẻ thanh toán', group: 'shop', svg: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
  wallet: {
    label: 'Ví tiền',
    group: 'shop',
    svg: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  },
  truck: {
    label: 'Giao hàng',
    group: 'shop',
    svg: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.5-4.3a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  },
  package: {
    label: 'Gói hàng',
    group: 'shop',
    svg: '<path d="M11 21.7a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7z"/><path d="M12 22V12M3.3 7 12 12l8.7-5M7.5 4.3l9 5.1"/>',
  },
  briefcase: {
    label: 'Công việc',
    group: 'shop',
    svg: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  },
  chart: { label: 'Biểu đồ', group: 'shop', svg: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>' },
  award: { label: 'Giải thưởng', group: 'shop', svg: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>' },
  shield: {
    label: 'Bảo hành',
    group: 'shop',
    svg: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  },

  // Everyday life
  coffee: {
    label: 'Cà phê',
    group: 'life',
    svg: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  },
  utensils: {
    label: 'Nhà hàng',
    group: 'life',
    svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  },
  cake: {
    label: 'Bánh / sinh nhật',
    group: 'life',
    svg: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  },
  wine: { label: 'Đồ uống', group: 'life', svg: '<path d="M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z"/>' },
  bed: { label: 'Khách sạn', group: 'life', svg: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>' },
  plane: {
    label: 'Du lịch',
    group: 'life',
    svg: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  },
  car: {
    label: 'Ô tô',
    group: 'life',
    svg: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  },
  book: { label: 'Sách', group: 'life', svg: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>' },
  graduation: { label: 'Học tập', group: 'life', svg: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
  sun: {
    label: 'Mặt trời',
    group: 'life',
    svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  },
  moon: { label: 'Mặt trăng', group: 'life', svg: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>' },
  leaf: {
    label: 'Thiên nhiên',
    group: 'life',
    svg: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
  },
  flame: {
    label: 'Nổi bật',
    group: 'life',
    svg: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  },

  // Media
  video: {
    label: 'Video',
    group: 'media',
    svg: '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  },
  image: { label: 'Hình ảnh', group: 'media', svg: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>' },
  mic: { label: 'Micro', group: 'media', svg: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>' },
  headphones: {
    label: 'Tai nghe',
    group: 'media',
    svg: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  },
  podcast: { label: 'Podcast', group: 'media', svg: '<circle cx="12" cy="11" r="1"/><path d="M11 17a1 1 0 0 1 2 0c0 .5-.3 3.5-.5 4.5a.5.5 0 0 1-1 0c-.2-1-.5-4-.5-4.5zM8 14a5 5 0 1 1 8 0M17.7 17.4a9 9 0 1 0-11.4 0"/>' },
  film: { label: 'Phim', group: 'media', svg: '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>' },
  radio: { label: 'Phát sóng', group: 'media', svg: '<path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>' },
  gamepad: { label: 'Trò chơi', group: 'media', svg: '<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="2"/>' },

  // Arrows
  arrowRight: { label: 'Mũi tên phải', group: 'arrows', svg: '<path d="M5 12h14M12 5l7 7-7 7"/>' },
  arrowLeft: { label: 'Mũi tên trái', group: 'arrows', svg: '<path d="M19 12H5M12 19l-7-7 7-7"/>' },
  arrowUp: { label: 'Lên đầu trang', group: 'arrows', svg: '<path d="M12 19V5M5 12l7-7 7 7"/>' },
  arrowDown: { label: 'Mũi tên xuống', group: 'arrows', svg: '<path d="M12 5v14M19 12l-7 7-7-7"/>' },
  chevronRight: { label: 'Tiếp', group: 'arrows', svg: '<path d="m9 18 6-6-6-6"/>' },
  chevronLeft: { label: 'Trước', group: 'arrows', svg: '<path d="m15 18-6-6 6-6"/>' },
  chevronDown: { label: 'Mở xuống', group: 'arrows', svg: '<path d="m6 9 6 6 6-6"/>' },
  chevronUp: { label: 'Thu lên', group: 'arrows', svg: '<path d="m18 15-6-6-6 6"/>' },
  external: { label: 'Mở ngoài', group: 'arrows', svg: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' },
  refresh: {
    label: 'Làm mới',
    group: 'arrows',
    svg: '<path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16M8 16H3v5"/>',
  },
}

export const ICON_GROUPS = [
  ['social', 'Mạng xã hội'],
  ['contact', 'Liên hệ'],
  ['shop', 'Mua sắm'],
  ['life', 'Đời sống'],
  ['media', 'Đa phương tiện'],
  ['general', 'Chung'],
  ['arrows', 'Mũi tên'],
]

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Full <svg> markup for an icon button's props: `icon`, `iconColor` (colour or gradient), `iconSize`
 * (% of the box) and `strokeWidth`. Unknown icon names fall back to a star. `id` must be unique on
 * the page when the colour is a gradient (it names the SVG gradient definition).
 */
export function iconSvg(p, id = 'icon') {
  const icon = ICON_LIBRARY[p.icon] ?? ICON_LIBRARY.star
  const size = Math.max(10, Math.min(100, Number(p.iconSize) || 50))
  const stroke = Math.max(0.5, Math.min(4, Number(p.strokeWidth) || 2))
  // Spans the whole 24×24 drawing, so single straight strokes (dots, dashes) still get painted.
  const def = svgGradientDef(p.iconColor, `${id}-g`, [0, 0, 24, 24])
  const paint = esc(svgPaint(p.iconColor, `${id}-g`))
  // Outline icons are stroked with the colour; filled ones are painted with it and have no stroke.
  const look = icon.filled
    ? `fill="${paint}" stroke="none"`
    : `fill="none" stroke="${paint}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}%" height="${size}%" ${look} ` +
    `style="display:block;flex:none" aria-hidden="true">${def ? `<defs>${def}</defs>` : ''}${icon.svg.replaceAll('{id}', id)}</svg>`
  )
}
