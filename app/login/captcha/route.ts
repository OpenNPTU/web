import { getPendingLogin } from "@/lib/nptu/store";

// Relays the school's captcha image for a pending login attempt. The image is
// bound to the attempt's upstream session cookie, which is why it has to go
// through the server instead of the browser hitting webap2 directly.
export async function GET(request: Request) {
  const attemptId = new URL(request.url).searchParams.get("t") ?? "";
  const client = getPendingLogin(attemptId);
  if (!client) {
    return new Response("login attempt expired", { status: 410 });
  }

  try {
    const captcha = await client.fetchCaptcha();
    return new Response(captcha.bytes.slice().buffer as ArrayBuffer, {
      headers: {
        "content-type": captcha.contentType,
        "cache-control": "no-store",
      },
    });
  } catch (cause) {
    console.error("nptu captcha fetch failed", cause);
    return new Response("captcha fetch failed", { status: 502 });
  }
}
