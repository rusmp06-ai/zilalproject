export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api/backend/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
    signal: options.signal || AbortSignal.timeout(65000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new APIError(
      response.status,
      typeof data.detail === "string"
        ? data.detail
        : "Проверьте обязательные поля. Данные не сохранены.",
    );
  return data;
}
