export function weekdayOf(date: string) {
  return (new Date(date + 'T12:00:00').getDay() + 6) % 7;
}

export function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return year + '-' + month + '-' + String(date.getDate()).padStart(2, '0');
}

export function moveDay(day: string, delta: number) {
  const date = new Date(day + 'T12:00:00');
  date.setDate(date.getDate() + delta);
  return dayKey(date);
}
