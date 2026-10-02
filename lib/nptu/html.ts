// Tag-soup helpers for parsing webap2 content pages. The upstream renders
// table-based layouts with attribute orders that vary between pages, so every
// helper is deliberately regex-based and order-agnostic instead of using a
// DOM dependency.

export function cellText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

/** Every table row flattened to cell text, in document order. */
export function tableRows(html: string): string[][] {
  const rows: string[][] = [];
  for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) => cellText(cell[1]),
    );
    rows.push(cells);
  }
  return rows;
}

/**
 * All <table>…</table> blocks extracted with balanced nesting, innermost
 * first — upstream wraps data grids inside layout tables, so a naive
 * non-greedy regex stops at the first nested closing tag and never sees the
 * grid.
 */
export function tableBlocks(html: string): string[] {
  const blocks: string[] = [];
  const stack: number[] = [];
  for (const match of html.matchAll(/<table\b[^>]*>|<\/table>/gi)) {
    if (/^<table/i.test(match[0])) {
      stack.push(match.index + match[0].length);
    } else if (stack.length > 0) {
      const start = stack.pop()!;
      blocks.push(html.slice(start, match.index));
    }
  }
  return blocks.reverse();
}

/**
 * The first table whose header row matches `names` (order-insensitive
 * comparison of trimmed text), returning the header plus data rows.
 * This is how upstream data grids are located — they have no stable ids.
 */
export function findTableByHeader(
  html: string,
  names: string[],
): { header: string[]; rows: string[][] } | null {
  const wanted = new Set(names);
  for (const block of tableBlocks(html)) {
    const rows = tableRows(block);
    if (rows.length < 2) continue;
    const header = rows[0].filter(Boolean);
    if (header.length < names.length) continue;
    const hits = header.filter((cell) => wanted.has(cell)).length;
    if (hits === names.length) {
      return { header, rows: rows.slice(1) };
    }
  }
  return null;
}

function tagAttribute(tag: string, attr: string): string | null {
  const match = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
  return match ? match[1] : null;
}

/** <option> list of the select whose name ends with `suffix` (e.g. ddlSYSE). */
export function selectOptions(
  html: string,
  suffix: string,
): Array<{ value: string; label: string; selected: boolean }> {
  const select = selectTag(html, suffix);
  if (!select) return [];
  return [...select.matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/gi)].map((match) => ({
    value: tagAttribute(match[1], "value") ?? "",
    label: cellText(match[2]),
    selected: /\bselected\b/i.test(match[1]),
  }));
}

export function selectSelected(html: string, suffix: string): { value: string; label: string } | null {
  const options = selectOptions(html, suffix);
  return options.find((option) => option.selected) ?? options[0] ?? null;
}

function selectTag(html: string, suffix: string): string | null {
  for (const match of html.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)) {
    const name = tagAttribute(match[0], "name");
    if (name && name.endsWith(`:${suffix}`)) return match[0];
  }
  return null;
}

/** Value of the input whose name ends with `suffix` (e.g. txtSTUDENT_ID). */
export function inputValue(html: string, suffix: string): string {
  for (const match of html.matchAll(/<input\b[^>]*>/gi)) {
    const name = tagAttribute(match[0], "name");
    if (!name || !name.endsWith(`:${suffix}`)) continue;
    if (/\btype\s*=\s*"(?:checkbox|radio|submit|image)"/i.test(match[0])) continue;
    return tagAttribute(match[0], "value") ?? "";
  }
  return "";
}

/** The selected label of the select whose name ends with `suffix`. */
export function selectValue(html: string, suffix: string): string {
  return selectSelected(html, suffix)?.label ?? "";
}

/** <form ... action="..."> of the page — where its postbacks must go. */
export function formAction(html: string): string | null {
  const match = /<form[^>]*\baction="([^"]*)"/i.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

/** [4] / [050607] bracket groups used by upstream for weekday/period cells. */
export function bracketGroups(text: string): string[] {
  return [...text.matchAll(/\[([^\]]*)\]/g)].map((match) => match[1]);
}
