export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store");
  }
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function parseJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "unsupported_media_type", "Yêu cầu phải dùng application/json.");
  }

  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    throw new HttpError(411, "length_required", "Thiếu Content-Length.");
  }
  const size = Number(contentLength);
  if (!Number.isFinite(size) || size < 0 || size > 65_536) {
    throw new HttpError(413, "payload_too_large", "Payload vượt quá 64 KiB.");
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new HttpError(400, "invalid_json", "JSON không hợp lệ.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_body", "Payload phải là JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "invalid_field", `${key} là bắt buộc.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new HttpError(400, "invalid_field", `${key} vượt quá ${maxLength} ký tự.`);
  }
  return normalized;
}

export function optionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_field", `${key} phải là chuỗi.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new HttpError(400, "invalid_field", `${key} vượt quá ${maxLength} ký tự.`);
  }
  return normalized || null;
}

export function optionalInteger(
  body: Record<string, unknown>,
  key: string,
  minimum: number,
): number | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new HttpError(400, "invalid_field", `${key} phải là số nguyên ≥ ${minimum}.`);
  }
  return value as number;
}

export function booleanValue(
  body: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = body[key];
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "boolean") {
    throw new HttpError(400, "invalid_field", `${key} phải là boolean.`);
  }
  return value;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, "origin_rejected", "Origin không được phép.");
  }
}
