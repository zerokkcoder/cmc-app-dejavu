import "dotenv/config";
import { CMC_BASE_URL } from "./endpoints";
import { errorCode, isSuccess } from "./normalize";
import type { ApiCallRecord, CmcEnvelope } from "./types";

export class CmcError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export type CmcResponse<T> = {
  envelope: CmcEnvelope<T>;
  credits: number;
  record: ApiCallRecord;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Server-side-only CMC client. Reads CMC_API_KEY from process.env.
 * NEVER import this module from a Client Component.
 */
export class CmcClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  readonly calls: ApiCallRecord[] = [];

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.CMC_API_KEY;
    if (!key || key === "your_api_key_here") {
      throw new Error("CMC_API_KEY is not configured. Set it in .env (see .env.example).");
    }
    this.apiKey = key;
    this.baseUrl = process.env.CMC_API_BASE_URL ?? CMC_BASE_URL;
  }

  async get<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ): Promise<CmcResponse<T>> {
    const clean = Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    );
    const url = new URL(this.baseUrl + endpoint);
    Object.entries(clean).forEach(([k, v]) => url.searchParams.set(k, v));

    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, {
        headers: {
          "X-CMC_PRO_API_KEY": this.apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await sleep(Math.max(1000, retryAfter * 1000) * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        let detail = "";
        try {
          const body = (await response.json()) as { status?: { error_message?: string; error_code?: number | string } };
          detail = body.status?.error_message ?? JSON.stringify(body).slice(0, 300);
        } catch {
          detail = (await response.text()).slice(0, 300);
        }
        throw new CmcError(`CMC ${response.status} on ${endpoint}: ${detail}`, response.status, "http");
      }

      const envelope = (await response.json()) as CmcEnvelope<T>;
      if (!isSuccess(envelope.status?.error_code)) {
        throw new CmcError(
          envelope.status?.error_message ?? "CMC returned non-zero error code",
          200,
          errorCode(envelope.status?.error_code),
        );
      }
      const credits = envelope.status.credit_count ?? 0;
      const record: ApiCallRecord = {
        endpoint,
        params: clean,
        creditCount: credits,
        fetchedAt: new Date().toISOString(),
        rowCount: Array.isArray(envelope.data)
          ? envelope.data.length
          : envelope.data && typeof envelope.data === "object"
            ? Object.keys(envelope.data).length
            : 1,
      };
      this.calls.push(record);
      return { envelope, credits, record };
    }
    throw lastError ?? new Error(`Retry exhausted on ${endpoint}`);
  }

  get totalCredits(): number {
    return this.calls.reduce((sum, c) => sum + c.creditCount, 0);
  }
}
