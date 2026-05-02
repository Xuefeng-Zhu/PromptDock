export function clampIndex(current: number, delta: number, listLength: number): number {
  if (listLength <= 0) return 0;
  const next = current + delta;
  if (next < 0) return 0;
  if (next >= listLength) return listLength - 1;
  return next;
}
