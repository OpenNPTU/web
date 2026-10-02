// Session-bound data access over the upstream client.
//
// Dashboard pages call withStudentData() and get a small context that resolves
// pages through the session's menu tree, caches fetched pages briefly (the
// upstream is a slow legacy ASP.NET box — one fetch per page view, never per
// render), and detects an expired upstream session so the UI can ask for a
// re-login instead of rendering nonsense.

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { NptuClient, type FetchedPage } from "./client";
import { menuUrl, parseMenuTree, type MenuEntry } from "./menu";
import { getStudentSession, touchStudentSession } from "./store";

const WEB1 = "https://webap2.nptu.edu.tw/Web1";
const MENU_TREE_URL = `${WEB1}/Message/MenuTree.aspx`;
const MENU_REFERER = `${WEB1}/Message/Main.aspx`;

const PAGE_CACHE_TTL_MS = 60_000;
const MENU_CACHE_TTL_MS = 10 * 60_000;

export class UpstreamSessionExpired extends Error {
  constructor() {
    super("upstream NPTU session expired");
  }
}

export type Upstream = {
  /** Resolves a stable page code (e.g. "A0809Q") to its URL for this session. */
  menuUrl(code: string): Promise<string>;
  get(url: string, referer?: string): Promise<FetchedPage>;
  postback(
    page: FetchedPage,
    eventTarget: string,
    fields: Record<string, string>,
  ): Promise<FetchedPage>;
};

type PageCacheEntry = { page: FetchedPage; at: number };
type MenuCacheEntry = { entries: MenuEntry[]; at: number };

const globalScope = globalThis as typeof globalThis & {
  __nptuPageCache?: Map<string, PageCacheEntry>;
  __nptuMenuCache?: Map<string, MenuCacheEntry>;
};

export async function withStudentData<T>(
  fn: (upstream: Upstream) => Promise<T>,
): Promise<T> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  const record = sessionId ? getStudentSession(sessionId) : null;
  if (!record) throw new UpstreamSessionExpired();

  const client = NptuClient.fromState(record.upstream);
  const pages = (globalScope.__nptuPageCache ??= new Map());
  const menus = (globalScope.__nptuMenuCache ??= new Map());

  function assertLoggedIn(page: FetchedPage): FetchedPage {
    if (
      page.html.includes('name="LoginStd:txtAccount"') ||
      page.html.includes('id="LoginDefault_ibtLoginStd"')
    ) {
      throw new UpstreamSessionExpired();
    }
    return page;
  }

  try {
    return await fn({
      async menuUrl(code: string) {
        const cached = menus.get(sessionId!);
        let entries = cached?.entries;
        if (!entries || Date.now() - cached.at > MENU_CACHE_TTL_MS) {
          const page = assertLoggedIn(
            await client.get(MENU_TREE_URL, MENU_REFERER),
          );
          entries = parseMenuTree(page.html, MENU_TREE_URL);
          menus.set(sessionId!, { entries, at: Date.now() });
        }
        const url = menuUrl(entries, code);
        if (!url) throw new Error(`Menu entry ${code} not found upstream.`);
        return url;
      },
      async get(url: string, referer?: string) {
        const key = `${sessionId}|${url}`;
        const cached = pages.get(key);
        if (cached && Date.now() - cached.at < PAGE_CACHE_TTL_MS) {
          return cached.page;
        }
        const page = assertLoggedIn(await client.get(url, referer));
        pages.set(key, { page, at: Date.now() });
        return page;
      },
      async postback(page, eventTarget, fields) {
        const posted = assertLoggedIn(
          await client.postback(page, eventTarget, fields),
        );
        // The postback just changed upstream state behind this URL.
        pages.delete(`${sessionId}|${page.url}`);
        return posted;
      },
    });
  } finally {
    touchStudentSession(sessionId!, client.exportState());
  }
}
