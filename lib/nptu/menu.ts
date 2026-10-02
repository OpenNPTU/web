// MenuTree.aspx parsing — the per-session route table of webap2.
//
// Every logged-in page's real location is only discoverable through the menu
// tree: leaf entries either link straight to a content page
// (../A05/A0515SPage.aspx) or to the Message/Main.aspx wrapper carrying the
// module tokens. Both are usable with the session cookie, but the tokens
// change between sessions, so URLs must never be hardcoded — parsers resolve
// the page they need by its stable [CODE]_ label prefix.

import { cellText } from "./html";

export type MenuEntry = {
  code: string;
  label: string;
  url: string;
};

export function parseMenuTree(html: string, baseUrl: string): MenuEntry[] {
  const entries: MenuEntry[] = [];
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1].replace(/&amp;/g, "&");
    if (!/MENU_ID|\.aspx/i.test(href)) continue;
    const label = cellText(match[2]);
    const code = /\[([A-Z0-9]+)\]/.exec(label)?.[1];
    if (!code) continue;
    entries.push({ code, label, url: new URL(href, baseUrl).toString() });
  }
  return entries;
}

export function menuUrl(entries: MenuEntry[], code: string): string | null {
  return entries.find((entry) => entry.code === code)?.url ?? null;
}
