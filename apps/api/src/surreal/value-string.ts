/** Safe string for Surreal record fields (avoids implicit `[object Object]` stringification). */
export function surrealValueToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (typeof value === 'object') {
    const o = value as { toString?: () => string };
    if (typeof o.toString === 'function') {
      return o.toString();
    }
  }
  return '';
}
