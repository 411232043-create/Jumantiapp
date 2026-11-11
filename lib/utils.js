import clsx from 'clsx';

export const cn = (...args) => clsx(...args);

export function formatDate(value) {
  if (!value) return '-';
  const d = toDate(value);
  if (!d) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return null;
}

export function hitungABJ(diperiksa, bebas) {
  if (!diperiksa) return 0;
  return Math.round((bebas / diperiksa) * 1000) / 10;
}

export function docWithId(snap) {
  return { id: snap.id, ...snap.data() };
}

export function snapToArray(querySnap) {
  return querySnap.docs.map(docWithId);
}
