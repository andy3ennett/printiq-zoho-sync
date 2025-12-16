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
    const url = this.url(`customerbycode/${encodeURIComponent(code)}`);
    const resp = await http.get(url, { headers: this.headers() });
    return resp.data;
  }
}