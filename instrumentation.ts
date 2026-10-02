export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startReaper } = await import("./lib/nptu/reaper");
  startReaper();
}
