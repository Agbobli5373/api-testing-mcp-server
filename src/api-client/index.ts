import fs from "fs";
import path from "path";

type RequestOptions = {
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  backoff?: number;
  signal?: AbortSignal | null;
};

type MultipartFile = {
  fieldName: string;
  filePath?: string;
  filename?: string;
  contentType?: string;
  contentBase64?: string;
};

export class ApiClient {
  private defaultHeaders: Record<string, string> = {
    "User-Agent": "api-mcp-client/1.0",
    "Accept": "application/json, text/*;q=0.8, */*;q=0.1",
  };

  constructor(defaults?: { headers?: Record<string, string> }) {
    if (defaults?.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...defaults.headers };
    }
  }

  private mergeHeaders(headers?: Record<string, string>) {
    return { ...this.defaultHeaders, ...(headers || {}) };
  }

  async request(method: string, url: string, options: RequestOptions = {}): Promise<any> {
    const timeout = options.timeout ?? 30_000;
    const retries = Math.max(0, options.retries ?? 0);
    const backoff = options.backoff ?? 500;

    let attempt = 0;
    let lastError: any;

    while (attempt <= retries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const headers = this.mergeHeaders(options.headers);
        const init: RequestInit = {
          method,
          headers,
          signal: options.signal ?? controller.signal,
        };

        if (options.body != null) {
          if (typeof options.body === "object" && !(options.body instanceof FormData)) {
            if (!("Content-Type" in headers)) {
              (init.headers as Record<string, string>)["Content-Type"] = "application/json";
            }
            init.body = JSON.stringify(options.body);
          } else {
            init.body = options.body;
          }
        }

        const start = Date.now();
        const res = await fetch(url, init as any);
        const elapsed = Date.now() - start;

        clearTimeout(timer);

        const text = await res.text();
        let parsed: any = text;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          // leave as text
        }

        return {
          status: res.status,
          ok: res.ok,
          headers: Object.fromEntries(res.headers.entries ? res.headers.entries() : [] as any),
          body: parsed,
          rawBody: text,
          timeMs: elapsed,
        };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        if (attempt <= retries) {
          const wait = backoff * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  async get(url: string, opts?: RequestOptions) {
    return this.request("GET", url, opts);
  }

  async post(url: string, body?: any, opts?: RequestOptions) {
    return this.request("POST", url, { ...opts, body });
  }

  async put(url: string, body?: any, opts?: RequestOptions) {
    return this.request("PUT", url, { ...opts, body });
  }

  async delete(url: string, body?: any, opts?: RequestOptions) {
    return this.request("DELETE", url, { ...opts, body });
  }

  assertStatus(response: any, expected: number | number[]) {
    const expectedList = Array.isArray(expected) ? expected : [expected];
    if (!expectedList.includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}. Expected: ${expectedList.join(", ")}`);
    }
    return true;
  }

  async validateJsonSchema(data: any, schema: object): Promise<{ valid: boolean; errors?: any[] }> {
    let Ajv: any;
    try {
      Ajv = (await import("ajv")).default;
    } catch (err) {
      throw new Error(
        "AJV is not installed. Install it with `npm install ajv` to enable JSON Schema validation."
      );
    }

    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema as any);
    const valid = validate(data);
    return {
      valid: Boolean(valid),
      errors: (validate.errors || []).map((e: any) => ({ message: e.message, instancePath: e.instancePath, schemaPath: e.schemaPath })),
    };
  }

  async uploadMultipart(url: string, files: MultipartFile[], fields?: Record<string, string>, opts?: RequestOptions) {
    const headers = this.mergeHeaders(opts?.headers);
    if (typeof FormData === "undefined") {
      let FormDataPkg: any;
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: optional dependency may be missing; treat as any
        FormDataPkg = (await import("form-data")).default;
      } catch (err) {
        throw new Error(
          "FormData is not available in this Node environment. Install `form-data` (npm install form-data) or run on Node 18+ which provides FormData."
        );
      }

      const form = new FormDataPkg();
      if (fields) {
        for (const [k, v] of Object.entries(fields)) {
          form.append(k, v);
        }
      }

      for (const f of files) {
        if (f.filePath) {
          const resolved = path.resolve(f.filePath);
          form.append(f.fieldName, fs.createReadStream(resolved), {
            filename: f.filename || path.basename(resolved),
            contentType: f.contentType,
          } as any);
        } else if (f.contentBase64) {
          const buffer = Buffer.from(f.contentBase64, "base64");
          form.append(f.fieldName, buffer, {
            filename: f.filename || "file",
            contentType: f.contentType || "application/octet-stream",
          } as any);
        } else {
          throw new Error("Multipart file must have either filePath or contentBase64");
        }
      }

      const merged = { ...headers };
      delete (merged as any)["Content-Type"];
      const start = Date.now();
      const res = await fetch(url, { method: "POST", headers: merged as any, body: form as any });
      const elapsed = Date.now() - start;
      const text = await res.text();
      let parsed: any = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {}
      return { status: res.status, ok: res.ok, body: parsed, rawBody: text, timeMs: elapsed };
    } else {
      const form = new (globalThis as any).FormData();
      if (fields) {
        for (const [k, v] of Object.entries(fields)) form.append(k, v);
      }
      for (const f of files) {
        if (f.filePath) {
          const resolved = path.resolve(f.filePath);
          const stream = fs.createReadStream(resolved);
          form.append(f.fieldName, stream, { filename: f.filename || path.basename(resolved) });
        } else if (f.contentBase64) {
          const buffer = Buffer.from(f.contentBase64, "base64");
          form.append(f.fieldName, buffer, f.filename || "file");
        } else {
          throw new Error("Multipart file must have either filePath or contentBase64");
        }
      }

      const merged = { ...headers };
      delete (merged as any)["Content-Type"];

      const start = Date.now();
      const res = await fetch(url, { method: "POST", headers: merged as any, body: form as any });
      const elapsed = Date.now() - start;
      const text = await res.text();
      let parsed: any = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {}
      return { status: res.status, ok: res.ok, body: parsed, rawBody: text, timeMs: elapsed };
    }
  }

  async concurrentRequests(requests: { method: string; url: string; opts?: RequestOptions }[], concurrency = 5) {
    const results: any[] = [];
    const queue = requests.slice();

    const worker = async () => {
      while (queue.length) {
        const r = queue.shift()!;
        try {
          const res = await this.request(r.method, r.url, r.opts);
          results.push({ request: r, response: res });
        } catch (err) {
          results.push({ request: r, error: err instanceof Error ? err.message : String(err) });
        }
      }
    };

    const workers = new Array(Math.min(concurrency, requests.length)).fill(null).map(() => worker());
    await Promise.all(workers);
    return results;
  }
}

export default ApiClient;
