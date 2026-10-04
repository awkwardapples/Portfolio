/**
 * Outbound sanitising for the copy sent to Make.com (spec Q.2; ported from
 * the plugin's InputSanitizer, ADR-0037). The stored row keeps the original;
 * only the webhook copy is sanitised, because it ends up in a spreadsheet.
 *
 * For each string: remove null bytes, then do what WordPress's
 * sanitize_text_field did (drop script and style blocks with their content,
 * strip remaining tags, collapse whitespace, trim), then prefix a leading
 * =, +, - or @ with an apostrophe so a spreadsheet never evaluates it as a
 * formula. Collapsing and trimming first means leading whitespace cannot
 * hide a trigger. Numbers, booleans and null pass through; arrays and
 * objects are sanitised recursively with their keys and shape preserved.
 */
const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@']);

function sanitizeText(value: string): string {
  let text = value.replace(/\0/g, '');
  text = text.replace(/<(script|style)[^>]*?>[\s\S]*?<\/\1>/gi, '');
  // Tags, including one left unclosed at the end; a lone "<" in "x < y" stays.
  text = text.replace(/<\/?[a-z!][^>]*(>|$)/gi, '');
  text = text.replace(/[\r\n\t ]+/g, ' ').trim();
  if (text !== '' && FORMULA_TRIGGERS.has(text.charAt(0))) text = `'${text}`;
  return text;
}

export function sanitizeForOutbound(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeForOutbound);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeForOutbound(item),
      ]),
    );
  }
  return value;
}

export function sanitizeSubmissionPayload(
  answers: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return sanitizeForOutbound(answers) as Record<string, unknown>;
}
