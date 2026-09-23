import { NextResponse } from "next/server";
import {
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
  LlmValidationError,
} from "./llm";

export type ErrorCode =
  | "BAD_REQUEST"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "UNAVAILABLE"
  | "VALIDATION"
  | "UNKNOWN";

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}

export function errorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof LlmTimeoutError) {
    return NextResponse.json(
      { error: { code: "TIMEOUT", message: "The model took too long to respond. Please try again." } },
      { status: 504 },
    );
  }
  if (err instanceof LlmRateLimitError) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "Rate limit reached. Wait a moment and try again." } },
      { status: 429 },
    );
  }
  if (err instanceof LlmUnavailableError) {
    return NextResponse.json(
      {
        error: {
          code: "UNAVAILABLE",
          message: "The model is temporarily overloaded. Please try again in a moment.",
        },
      },
      { status: 503 },
    );
  }
  if (err instanceof LlmValidationError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "The model returned a response we couldn't parse. Please try again.",
        },
      },
      { status: 502 },
    );
  }
  // Log full detail server-side only — never echo raw upstream error bodies
  // (which can contain provider-internal JSON) back to the client.
  console.error(err);
  return NextResponse.json(
    { error: { code: "UNKNOWN", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

export function badRequest(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code: "BAD_REQUEST", message } },
    { status: 400 },
  );
}
