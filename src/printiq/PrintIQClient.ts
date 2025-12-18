import type { Logger } from "pino";
import { http } from "../zoho/http.js";

export type PrintIQClientConfig = {
  baseUrl: string; // e.g. https://yourtenant.printiq.com
  apiName: string;
  apiKey: string;
};

export class PrintIQClient {
  constructor(private readonly cfg: PrintIQClientConfig, private readonly logger: Logger) {}

  private url(path: string) {
    const base = this.cfg.baseUrl.replace(/\/+$/, "");
    return `${base}/webservice/webhook.svc/json/${path.replace(/^\/+/, "")}`;
  }

  private headers() {
    return {
      "PrintIQ-API-Name": this.cfg.apiName,
      "PrintIQ-API-Key": this.cfg.apiKey
    };
  }

 async getCustomerByCode(code: string): Promise<any> {
  const urlWithCode = this.url(`customerbycode/${encodeURIComponent(code)}`);
  const urlNoCode = this.url(`customerbycode`);

  const headersGet = this.headers();
  const headersPost = { ...this.headers(), "Content-Type": "application/json" };

  const attempts: Array<{ name: string; run: () => Promise<any> }> = [
    {
      name: "GET /customerbycode/{code}",
      run: async () => (await http.get(urlWithCode, { headers: headersGet })).data
    },
    {
      name: "POST /customerbycode/{code} (no body)",
      run: async () => (await http.post(urlWithCode, null, { headers: headersPost })).data
    },
    {
      name: "POST /customerbycode { code }",
      run: async () => (await http.post(urlNoCode, { code }, { headers: headersPost })).data
    },
    {
      name: "POST /customerbycode { customerCode }",
      run: async () =>
        (await http.post(urlNoCode, { customerCode: code }, { headers: headersPost })).data
    },
    {
      name: "POST /customerbycode { CustomerCode }",
      run: async () =>
        (await http.post(urlNoCode, { CustomerCode: code }, { headers: headersPost })).data
    }
  ];

  let lastStatus: number | undefined;
  let lastMessage = "";

  for (const a of attempts) {
    try {
      return await a.run();
    } catch (err: any) {
      lastStatus = err?.response?.status as number | undefined;
      lastMessage = err?.message ?? String(err);

      // If it’s NOT a 405, bubble it up immediately (auth, 404, 500, etc.)
      if (lastStatus && lastStatus !== 405) throw err;

      // Otherwise, try next variant
      this.logger?.warn?.({ attempt: a.name, status: lastStatus }, "PrintIQ diagnostic attempt failed");
    }
  }

  // All attempts failed (likely endpoint/method differs in this tenant)
  const e = new Error(
    `PrintIQ customerbycode failed after attempts: ${attempts.map((a) => a.name).join(", ")}`
  );
  (e as any).status = lastStatus ?? 405;
  (e as any).zohoRejected = true; // treat as non-retryable for diagnostics-style failures
  throw e;
 }
  
    async pingWsdl(): Promise<void> {
    const base = this.cfg.baseUrl.replace(/\/+$/, "");
    const url = `${base}/webservice/webhook.svc?wsdl`;

    // We include the headers anyway (harmless) in case the instance expects them
    await http.get(url, { headers: this.headers() });
  }
}