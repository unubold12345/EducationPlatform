// Same-origin JSON calls from the dashboard; the server's Mongolian error text is passed through.
export async function send<T>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new Error("Сүлжээний алдаа. Дахин оролдоно уу.");
  }
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(data?.error ?? "Түр алдаа гарлаа. Дахин оролдоно уу.");
  return data as T;
}
