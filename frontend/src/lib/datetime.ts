// Single source of truth for the <input type="datetime-local"> ↔ API contract.
//
// The API stores and returns UTC instants. A datetime-local input only ever
// speaks local wall-clock time and carries no offset, so every read and write
// has to cross that boundary explicitly. Doing it ad hoc is what let Create
// send an offset-less string while Edit pre-filled the UTC wall clock and
// re-submitted it as local — shifting every saved event by the UTC offset.

const pad = (n: number) => String(n).padStart(2, '0');

/** UTC ISO instant → "YYYY-MM-DDTHH:mm" in the viewer's local time. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" (local wall clock) → UTC ISO instant for the API. */
export function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString();
}
