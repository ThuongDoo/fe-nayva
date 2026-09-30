import { DEFAULT_PAGE } from './elements.js'

/** The empty page every user can start from. Real templates are made by admins and stored in Firestore. */
export const BLANK_TEMPLATE = {
  id: 'blank',
  name: 'Trang trống',
  description: 'Bắt đầu từ đầu',
  create: () => ({ page: { ...DEFAULT_PAGE }, elements: [] }),
}
