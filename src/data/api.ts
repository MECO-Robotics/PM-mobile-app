export const DEFAULT_API_BASE_URL = "http://localhost:8080";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

export class ApiNetworkError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("Network unavailable. Check your connection and try again.");
    this.name = "ApiNetworkError";
    this.cause = cause;
  }
}

export type MobileAuthErrorState =
  | "expired-session"
  | "network-unavailable"
  | "auth-config-unavailable"
  | "unknown";

export function isAuthStatus(status: number) {
  return status === 401 || status === 403;
}

export function classifyMobileAuthError(
  error: unknown,
  context: "auth-config" | "authenticated" | "general" = "general",
): MobileAuthErrorState {
  if (context === "auth-config") {
    return "auth-config-unavailable";
  }

  if (
    context === "authenticated" &&
    error instanceof ApiRequestError &&
    isAuthStatus(error.status)
  ) {
    return "expired-session";
  }

  if (error instanceof ApiNetworkError) {
    return "network-unavailable";
  }

  return "unknown";
}

export function getMobileAuthErrorMessage(state: MobileAuthErrorState) {
  switch (state) {
    case "expired-session":
      return "Your session expired. Sign in again.";
    case "network-unavailable":
      return "Network unavailable. Check your connection and try again.";
    case "auth-config-unavailable":
      return "Authentication service is unavailable. Check the backend auth configuration and try again.";
    case "unknown":
      return "Request failed unexpectedly.";
  }
}

function parseErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return null;
  }

  return message;
}

export function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, "");
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);
  headers.set("Accept", "application/json");

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new ApiNetworkError(error);
  }

  const rawBody = await response.text();
  let parsedBody: unknown = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      parseErrorMessage(parsedBody) ??
        `Request failed with status ${response.status}.`,
      response.status,
      parsedBody,
    );
  }

  return parsedBody as T;
}
