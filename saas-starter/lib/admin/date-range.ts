export function parseDateRange(searchParams: URLSearchParams) {
  const fromRaw = searchParams.get('from')?.trim() || '';
  const toRaw = searchParams.get('to')?.trim() || '';

  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;

  const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : null;

  if (validTo) {
    validTo.setHours(23, 59, 59, 999);
  }

  return { from: validFrom, to: validTo, fromRaw, toRaw };
}

export function inRange(date: Date | null, from: Date | null, to: Date | null) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
