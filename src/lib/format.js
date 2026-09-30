export const formatTime = (date) =>
  date ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date) : 'vừa xong'
