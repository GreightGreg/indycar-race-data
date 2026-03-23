/**
 * Converts "Last, First" or "Last First" to "First Last" format.
 * Handles rookie marker (R): "Hauger, Dennis (R)" → "Dennis Hauger (R)"
 * Handles names like "O'Ward, Pato" → "Pato O'Ward"
 */
export const formatDriverName = (name: string | null | undefined): string => {
  if (!name) return '';
  let cleaned = name.trim();

  // Extract rookie marker if present
  let rookie = '';
  const rookieMatch = cleaned.match(/\(R\)/i);
  if (rookieMatch) {
    rookie = ' (R)';
    cleaned = cleaned.replace(/\s*\(R\)\s*/i, ' ').trim();
  }

  // Handle "Last, First" format
  if (cleaned.includes(',')) {
    const [last, ...firstParts] = cleaned.split(',');
    return `${firstParts.join(',').trim()} ${last.trim()}${rookie}`;
  }

  // Handle "Last First" format (no comma)
  const parts = cleaned.split(' ');
  if (parts.length < 2) return cleaned + rookie;
  const [lastName, ...firstParts] = parts;
  return `${firstParts.join(' ')} ${lastName}${rookie}`;
};
