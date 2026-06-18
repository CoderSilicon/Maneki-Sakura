export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function blossomIcon(type: string): string {
  if (type === 'knowledge') return '📘';
  if (type === 'health') return '💚';
  return '✨';
}
