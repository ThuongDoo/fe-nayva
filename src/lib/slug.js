/** Strips Vietnamese diacritics: "Tiệm Bánh" → "Tiem Banh". */
export const stripDiacritics = (text = '') => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/** "Tiệm Bánh Mây!" → "tiem-banh-may": a site-name suggestion from a page title. */
export const slugify = (text = '') =>
  stripDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
