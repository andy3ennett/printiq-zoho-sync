import type { Logger } from "pino";
import { http } from "../zoho/http.js";

type PrintIQClientConfig = {
  baseUrl: string;   // e.g. https://nps-group.printiq.com
  apiName: string;
  apiKey: string;
};

export class PrintIQClient {
  constructor(private cfg: PrintIQClientConfig, private logger: Logger) {}

  private base(): string {
    return this.cfg.baseUrl.replace(/\/+$/, "");
  }

  private url(path: string): string {
    // path should start without leading slash for consistency
    const p = path.replace(/^\/+/, "");
    return `${this.base()}/${p}`;
  }

  private headers(): Record<string, string> {
    return {
      Accept: "application/json",
      "PrintIQ-API-Name": this.cfg.apiName,
      "PrintIQ-API-Key": this.cfg.apiKey
    };
  }

  async getCustomers(): Promise<any[]> {
    // canonical trailing slash matters on this tenant
    const url = this.url("webservice/webhook.svc/json/customers/");
    const resp = await http.get(url, { headers: this.headers() });

    // Expect an array
    return Array.isArray(resp.data) ? resp.data : [];
  }

  async getCustomerByCode(code: string): Promise<any[]> {
    const safeCode = encodeURIComponent(code);
    const url = this.url(`webservice/webhook.svc/json/customerbycode/${safeCode}`);
    const resp = await http.get(url, { headers: this.headers() });

    // PrintIQ returns [] when not found (expected)
    return Array.isArray(resp.data) ? resp.data : [];
  }
}