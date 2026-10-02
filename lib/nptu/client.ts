// Headless client for webap2.nptu.edu.tw (ASP.NET WebForms).
//
// Deliberately self-contained: only node built-ins + fetch, no project imports.
// The whole client (cookie jar + hidden form state) can be exported to plain
// JSON and rehydrated later, which is what lets a restarted server still issue
// the upstream logout that the school requires — logging out improperly locks
// the account for ~5 minutes.

const ORIGIN = "https://webap2.nptu.edu.tw";
const WEB1 = `${ORIGIN}/Web1`;
const ALLOWED_HOST = "webap2.nptu.edu.tw";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export type ClientState = {
  cookies: Record<string, string>;
  hidden: Record<string, string>;
};

export type LoginResult =
  | { ok: true; page: FetchedPage; warning: string | null }
  | { ok: false; error: string };

export type Captcha = {
  bytes: Uint8Array;
  contentType: string;
};

export type FetchedPage = {
  url: string;
  html: string;
};

const REQUEST_TIMEOUT_MS = 20_000;

export class NptuClient {
  private cookies = new Map<string, string>();
  private hidden: Record<string, string> = {};

  static fromState(state: ClientState): NptuClient {
    const client = new NptuClient();
    for (const [name, value] of Object.entries(state.cookies)) {
      client.cookies.set(name, value);
    }
    for (const [name, value] of Object.entries(state.hidden)) {
      client.hidden[name] = value;
    }
    return client;
  }

  exportState(): ClientState {
    return {
      cookies: Object.fromEntries(this.cookies),
      hidden: { ...this.hidden },
    };
  }

  /**
   * GET the portal, POST the "student system" image button, and keep the
   * hidden fields (__VIEWSTATE / __EVENTVALIDATION) the rendered login panel
   * expects on submit. The captcha is bound to the session cookie held here.
   */
  async begin(): Promise<void> {
    const portal = await this.request(`${WEB1}/Secure/default.aspx`);
    const portalHidden = hiddenInputs(portal.html);

    const click = new URLSearchParams(portalHidden);
    click.set("LoginDefault:ibtLoginStd.x", "12");
    click.set("LoginDefault:ibtLoginStd.y", "12");
    click.set("LoginDefault:txtScreenWidth", "1920");
    click.set("LoginDefault:txtScreenHeight", "1080");
    const panel = await this.request(`${WEB1}/Secure/default.aspx`, {
      method: "POST",
      body: click.toString(),
      referer: `${WEB1}/Secure/default.aspx`,
    });

    this.hidden = hiddenInputs(panel.html);
    if (!panel.html.includes('name="LoginStd:txtAccount"')) {
      throw new Error("Login panel did not render (LoginStd form missing).");
    }
  }

  /** Fresh captcha image for the pending session; each call returns a new code. */
  async fetchCaptcha(): Promise<Captcha> {
    const res = await fetch(`${WEB1}/Modules/CaptchaCreator.aspx`, {
      headers: {
        "user-agent": UA,
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        referer: `${WEB1}/Secure/default.aspx`,
        ...(this.cookies.size ? { cookie: this.cookieHeader() } : {}),
      },
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    for (const raw of res.headers.getSetCookie()) {
      this.absorbSetCookie(raw);
    }
    if (!res.ok) {
      throw new Error(`Captcha request failed with HTTP ${res.status}.`);
    }
    return {
      bytes: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") ?? "image/png",
    };
  }

  async submitLogin(account: string, password: string, checkCode: string): Promise<LoginResult> {
    const body = new URLSearchParams(this.hidden);
    body.set("LoginStd:txtAccount", account);
    body.set("LoginStd:txtPassWord", password);
    body.set("LoginStd:txtCheckCode", checkCode);
    body.set("LoginStd:ibtLogin.x", "15");
    body.set("LoginStd:ibtLogin.y", "12");
    const page = await this.request(`${WEB1}/Secure/default.aspx`, {
      method: "POST",
      body: body.toString(),
      referer: `${WEB1}/Secure/default.aspx`,
    });

    // Whether we are still staring at the login form is the real success test:
    // the landing page pops alerts (e.g. the password-age reminder) that are
    // warnings, not failures — the browser flow just clicks them away.
    if (page.html.includes('name="LoginStd:txtAccount"')) {
      // A captcha-rejected login has been observed to block the next login
      // for ~5 minutes. Whether that is a live session on the fresh cookies
      // or an attempt-level throttle upstream is unconfirmed — logging out
      // with the same jar covers the former and is a cheap no-op for the
      // latter.
      await this.logout().catch(() => {});
      return {
        ok: false,
        error: firstAlertText(page.html) ?? "登入失敗，請重試。",
      };
    }
    // The password-age warning pops on the redirect shell, so keep it before
    // following the hop to the frameset.
    const shellAlert = firstAlertText(page.html);
    const landing = await this.followJsRedirects(page);
    return {
      ok: true,
      page: landing,
      warning: firstAlertText(landing.html) ?? shellAlert,
    };
  }

  /** Authenticated GET of any Web1 page (parsers build on this). */
  get(url: string, referer?: string): Promise<FetchedPage> {
    return this.request(url, referer ? { referer } : {});
  }

  /**
   * Generic ASP.NET postback against an already-fetched content page
   * (semester dropdowns, tabs). The POST goes to the page's own <form
   * action> — wrapper URLs (Message/Main.aspx?...) re-render their default
   * state instead of running the content page's postback handler.
   */
  async postback(
    page: FetchedPage,
    eventTarget: string,
    fields: Record<string, string>,
  ): Promise<FetchedPage> {
    const action = /<form[^>]*\baction="([^"]*)"/i.exec(page.html)?.[1];
    const target = action ? new URL(action, page.url).toString() : page.url;
    const body = new URLSearchParams(hiddenInputs(page.html));
    body.set("__EVENTTARGET", eventTarget);
    body.set("__EVENTARGUMENT", "");
    for (const [name, value] of Object.entries(fields)) {
      body.set(name, value);
    }
    return this.request(target, {
      method: "POST",
      body: body.toString(),
      referer: page.url,
    });
  }

  /**
   * The login POST lands on a ~200-byte shell whose only job is
   * `location.href='../Message/default.aspx'` — follow those hops by hand.
   */
  private async followJsRedirects(page: FetchedPage): Promise<FetchedPage> {
    let current = page;
    for (let hop = 0; hop < 3; hop += 1) {
      const target = /location\.href\s*=\s*['"]([^'"]+)['"]/.exec(current.html)?.[1];
      if (!target) return current;
      current = await this.request(new URL(target, current.url).toString(), {
        referer: current.url,
      });
    }
    return current;
  }

  /**
   * GET the header page and read the logged-in identity out of it. The same
   * page's hidden fields are stashed because logging out is a postback on it.
   */
  async whoami(): Promise<Identity> {
    const page = await this.request(`${WEB1}/Message/Main.aspx`, {
      referer: `${WEB1}/Message/default.aspx`,
    });
    this.hidden = hiddenInputs(page.html);
    return parseIdentity(page.html);
  }

  /**
   * Proper upstream logout — a postback of the CommonHeader:ibtLogOut image
   * button on Main.aspx, then one verification GET. Skipping this (or dying
   * mid-session) locks the account out of webap2 for ~5 minutes.
   */
  async logout(): Promise<boolean> {
    const header = await this.request(`${WEB1}/Message/Main.aspx`, {
      referer: `${WEB1}/Message/default.aspx`,
    });
    if (!header.html.includes("CommonHeader_lblName")) {
      return true; // already logged out server-side
    }    const body = new URLSearchParams(hiddenInputs(header.html));
    body.set("CommonHeader:ibtLogOut.x", "10");
    body.set("CommonHeader:ibtLogOut.y", "10");
    await this.request(`${WEB1}/Message/Main.aspx`, {
      method: "POST",
      body: body.toString(),
      referer: `${WEB1}/Message/Main.aspx`,
    });
    const check = await this.request(`${WEB1}/Message/Main.aspx`, {
      referer: `${WEB1}/Message/default.aspx`,
    });
    return !check.html.includes("CommonHeader_lblName");
  }

  private assertSameHost(url: string): void {
    const host = new URL(url).host;
    if (host !== ALLOWED_HOST) {
      throw new Error(
        `Refusing to send requests off ${ALLOWED_HOST} (target host: ${host})`,
      );
    }
  }

  private cookieHeader(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  private absorbSetCookie(raw: string): void {
    const pair = raw.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) {
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  /**
   * Manual redirect loop: Node's fetch has no cookie jar, so every hop is
   * issued by hand (merging Set-Cookie, dropping the body after a 3xx) to
   * keep the ASP.NET session coherent.
   */
  private async request(url: string, init: { method?: string; body?: string; referer?: string } = {}): Promise<FetchedPage> {
    let current = url;
    let method = init.method ?? "GET";
    let body = init.body;
    for (let hop = 0; hop < 6; hop += 1) {
      // The jar is not domain-scoped, so the host pin is what guarantees the
      // student's session cookies can only ever travel to the school —
      // checked on every hop, because redirect targets and postback form
      // actions are upstream-controlled data.
      this.assertSameHost(current);
      const headers: Record<string, string> = {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
      };
      if (this.cookies.size) headers.cookie = this.cookieHeader();
      if (init.referer) headers.referer = init.referer;
      if (body != null) headers["content-type"] = "application/x-www-form-urlencoded";

      const res = await fetch(current, {
        method,
        headers,
        body: method === "GET" ? undefined : body,
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      for (const raw of res.headers.getSetCookie()) {
        this.absorbSetCookie(raw);
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) {
          current = new URL(location, current).toString();
          method = "GET";
          body = undefined;
          continue;
        }
      }
      return { url: current, html: await res.text() };
    }
    throw new Error("Too many redirects talking to webap2.");
  }
}

export type Identity = {
  studentId: string | null;
  name: string | null;
  semester: string | null;
};

/** Identity from the logged-in header page (Message/Main.aspx). */
export function parseIdentity(html: string): Identity {
  const raw = /id="CommonHeader_lblName"[^>]*>([^<]+)</.exec(html)?.[1]?.trim() ?? null;
  const name = raw ? raw.replace(/[(（][^)）]*[)）]\s*$/, "").trim() || raw : null;
  const semester = /\d{2,3}學年度(?:第[123一二三]學期|暑期)/.exec(html)?.[0] ?? null;
  return { studentId: null, name, semester };
}

/** All <input type="hidden"> name/value pairs, attribute-order agnostic. */
export function hiddenInputs(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const tag of html.matchAll(/<input\b[^>]*>/gi)) {
    const input = tag[0];
    if (!/\btype\s*=\s*["']hidden["']/i.test(input)) continue;
    const name = /\bname\s*=\s*"([^"]*)"/i.exec(input)?.[1];
    if (!name) continue;
    fields[name] = /\bvalue\s*=\s*"([^"]*)"/i.exec(input)?.[1] ?? "";
  }
  return fields;
}

/** First alert('...') the page would pop — how this system reports errors. */
export function firstAlertText(html: string): string | null {
  const match = /alert\s*\(\s*(['"])([\s\S]*?)\1\s*\)/.exec(html);
  return match ? match[2] : null;
}
