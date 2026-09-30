const ICONS = {
  heading: <path d="M6 4v16M18 4v16M6 12h12" />,
  icon: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 7 1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z" />
    </>
  ),
  text: <path d="M4 6h16M4 12h16M4 18h10" />,
  button: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="3" />
      <path d="M9 12h6" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  shape: (
    <>
      <path d="M8 3l5 5-5 5-5-5z" />
      <circle cx="16" cy="16" r="5" />
    </>
  ),
  box: <rect x="4" y="4" width="16" height="16" rx="3" />,
  divider: <path d="M3 12h18M8 7h8M8 17h8" />,
  audio: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  video: (
    <>
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <path d="m17 10 5-3v10l-5-3z" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />,
  maximize: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />,
  minimize: <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M16 21v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />,
  rotate: <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />,
  // A ball with speed lines: motion effects.
  motion: <path d="M14 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM2 9h4.5M3 15h3.5M4.5 12H7" />,
  rotateLeft: <path d="M3 12a9 9 0 1 0 2.6-6.4M3 3v6h6" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <path d="m3 3 18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.9-1" />
    </>
  ),
  tag: <path d="M3 12.2V4a1 1 0 0 1 1-1h8.2L21 11.8 11.8 21zM7.5 7.5h.01" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  home: <path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  cloud: <path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9M12 21v-8M9 16l3-3 3 3" />,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  magnet: <path d="M5 4h4v7a3 3 0 0 0 6 0V4h4v7a7 7 0 0 1-14 0zM5 8h4M15 8h4" />,
  move: <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  front: <path d="M12 19V5M5 12l7-7 7 7" />,
  back: <path d="M12 5v14M19 12l-7 7-7-7" />,
  top: <path d="M5 4h14M12 20V9M6 14l6-6 6 6" />,
  bottom: <path d="M5 20h14M12 4v11M6 10l6 6 6-6" />,
  alignLeft: <path d="M4 6h16M4 12h10M4 18h14" />,
  alignCenter: <path d="M4 6h16M7 12h10M5 18h14" />,
  alignRight: <path d="M4 6h16M10 12h10M6 18h14" />,
  alignJustify: <path d="M4 6h16M4 12h16M4 18h16" />,
  vTop: <path d="M4 4h16M12 8v12M8 12l4-4 4 4" />,
  vMiddle: <path d="M4 12h16M12 3v5M12 16v5M9 6l3 2 3-2M9 18l3-2 3 2" />,
  vBottom: <path d="M4 20h16M12 4v12M8 12l4 4 4-4" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  target: <path d="M12 2v4M12 18v4M2 12h4M18 12h4M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12 5 5L20 7" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-5-5" />,
  shield: <path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3ZM9 12l2 2 4-4" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />,
  at: <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />,
  decor: <path d="M12 3c-3 4.2-6 7.2-6 11a6 6 0 0 0 12 0c0-3.8-3-6.8-6-11ZM19.5 4.5h.01M21 9h.01" />,
  shuffle: <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />,
  blend: <path d="M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM15 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />,
  external: <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />,
  fit: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  centerH: <path d="M12 3v18M7 8h10v8H7z" />,
  layers: <path d="m12 3 9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />,
  sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  corner: <path d="M4 20v-9a7 7 0 0 1 7-7h9" />,
  flipH: (
    <>
      <path d="M12 3v18" strokeDasharray="2 2" />
      <path d="M8 7 3 12l5 5z" />
      <path d="m16 7 5 5-5 5z" />
    </>
  ),
  flipV: (
    <>
      <path d="M3 12h18" strokeDasharray="2 2" />
      <path d="M7 8l5-5 5 5z" />
      <path d="m7 16 5 5 5-5z" />
    </>
  ),
  opacity: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </>
  ),
  spacing: <path d="M3 6h12M3 12h12M3 18h12M20 4v16M18 6l2-2 2 2M18 18l2 2 2-2" />,
  italic: <path d="M19 4h-9M14 20H5M15 4 9 20" />,
  underline: <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />,
  logo: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </>
  ),
}

export default function Icon({ name, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
