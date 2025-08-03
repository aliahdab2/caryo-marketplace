export function timeAgo(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diff < minute) {
    return rtf.format(-Math.floor(diff / 1000), 'second');
  } else if (diff < hour) {
    return rtf.format(-Math.floor(diff / minute), 'minute');
  } else if (diff < day) {
    return rtf.format(-Math.floor(diff / hour), 'hour');
  } else if (diff < week) {
    return rtf.format(-Math.floor(diff / day), 'day');
  } else if (diff < month) {
    return rtf.format(-Math.floor(diff / week), 'week');
  } else if (diff < year) {
    return rtf.format(-Math.floor(diff / month), 'month');
  } else {
    return rtf.format(-Math.floor(diff / year), 'year');
  }
}

export function formatDate(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDateTime(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
