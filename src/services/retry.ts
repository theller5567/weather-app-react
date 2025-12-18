export type RetryDecision = (error: unknown, attemptIndex: number) => boolean;

export interface RetryOptions {
  retries?: number; // total attempts = retries + 1
  baseDelayMs?: number; // initial backoff
  maxDelayMs?: number; // cap
  jitter?: boolean; // add randomization to spread load
  timeoutMs?: number; // per-attempt timeout
  retryOn?: RetryDecision; // decide whether to retry for a given error
}

export type ApiErrorKind = "network" | "http_4xx" | "http_5xx" | "timeout" | "unknown";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  cause?: unknown;
  constructor(kind: ApiErrorKind, message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}

export function classifyError(error: unknown): ApiError {
  // Timeout: we throw our own ApiError("timeout", ...)
  if (error instanceof ApiError) return error;

  // Some runtimes throw TypeError on network errors
  if (error instanceof TypeError) {
    return new ApiError("network", error.message, undefined, error);
  }

  // If a fetch-like error bubbles up with status
  const anyErr = error as { status?: number; message?: string };
  if (typeof anyErr?.status === "number") {
    const status = anyErr.status;
    if (status >= 500) return new ApiError("http_5xx", `Server error (${status})`, status, error);
    if (status >= 400) return new ApiError("http_4xx", `Client error (${status})`, status, error);
  }

  return new ApiError("unknown", (anyErr?.message as string) ?? "Unknown error", undefined, error);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoff(attempt: number, base: number, max: number, jitter: boolean): number {
  const exp = Math.min(max, base * Math.pow(2, attempt));
  if (!jitter) return exp;
  const rand = Math.random() * exp * 0.2; // up to 20% jitter
  return exp - exp * 0.1 + rand; // +/- ~10%
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 3,
    baseDelayMs = 300,
    maxDelayMs = 2000,
    jitter = true,
    timeoutMs = 8000,
    retryOn = (err) => {
      const cls = classifyError(err);
      return cls.kind === "network" || cls.kind === "timeout" || cls.kind === "http_5xx";
    },
  }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Per-attempt timeout via race
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new ApiError("timeout", `Request timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      return result;
    } catch (err) {
      lastError = err;
      if (attempt === retries || !retryOn(err, attempt)) break;
      const delay = backoff(attempt, baseDelayMs, maxDelayMs, jitter);
      await sleep(delay);
    }
  }
  throw classifyError(lastError);
}


