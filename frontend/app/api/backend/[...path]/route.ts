import { NextRequest } from "next/server";
import { backendURL, serverMode } from "@/services/server";
const entities = "(?:tours|destinations|experiences|journal|gallery|reviews)";
function permitted(path: string, method: string) {
  if (method === "GET")
    return /^(auth\/me|public\/platform|admin\/platform)$/.test(path);
  if (method === "POST")
    return (
      /^(auth\/(login|logout))$/.test(path) ||
      new RegExp(`^admin/content/${entities}$`).test(path)
    );
  if (method === "PUT")
    return (
      path === "admin/settings" ||
      new RegExp(`^admin/content/${entities}/[a-zA-Z0-9_-]+$`).test(path)
    );
  if (method === "DELETE")
    return new RegExp(`^admin/content/${entities}/[a-zA-Z0-9_-]+$`).test(path);
  return false;
}
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!serverMode())
    return Response.json(
      { detail: "Серверный режим не включён" },
      { status: 404 },
    );
  const path = (await params).path.join("/");
  if (!permitted(path, request.method))
    return Response.json({ detail: "Маршрут не найден" }, { status: 404 });
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== process.env.SITE_ORIGIN
  )
    return Response.json(
      { detail: "Недопустимый источник запроса" },
      { status: 403 },
    );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = request.cookies.get("zilal_session")?.value;
  if (token) headers.Cookie = `zilal_session=${token}`;
  for (const name of ["origin", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  try {
    const body = ["POST", "PUT"].includes(request.method)
      ? await request.text()
      : undefined;
    if (body && new TextEncoder().encode(body).length > 262144)
      return Response.json(
        { detail: "Запрос слишком большой" },
        { status: 413 },
      );
    const url = `${backendURL()}/api/v1/${path}`;
    const version = request.nextUrl.searchParams.get("version");
    const upstream = await fetch(
      url +
        (request.method === "DELETE" && version
          ? `?version=${encodeURIComponent(version)}`
          : ""),
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(60000),
      },
    );
    const response = new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return Response.json(
      {
        detail:
          "Сервер пока недоступен. Данные не сохранены; попробуйте ещё раз.",
      },
      { status: 503 },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
