/**
 * Converts "Last First" to "First Last" format.
 * Handles names like "O'Ward Pato" → "Pato O'Ward"
 * If name has only one word or is empty, returns as-is.
 */
export const formatDriverName = (name: string | null | undefined): string => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  // First part is last name, rest is first name(s)
  const [lastName, ...firstParts] = parts;
  return `${firstParts.join(' ')} ${lastName}`;
};
