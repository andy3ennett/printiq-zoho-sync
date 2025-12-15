import type { Logger } from "pino";
import { http } from "./http.js";

type TokenCache = { accessToken: string; expiresAt: number };

export type ZohoClientConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiBase: string; // e.g. https://www.zohoapis.eu/crm/v2
  accountsBase: string; // e.g. https://accounts.zoho.eu
  orgId?: string;
};

export interface IZohoClient {
  upsert(moduleApiName: string, externalIdField: string, record: Record<string, any>): Promise<void>;
}

export class ZohoClient implements IZohoClient {
  private token: TokenCache | null = null;

  constructor(private readonly cfg: ZohoClientConfig, private readonly logger: Logger) {}

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) return this.token.accessToken;

    const url = `${this.cfg.accountsBase}/oauth/v2/token`;
    const params = new URLSearchParams({
      refresh_token: this.cfg.refreshToken,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: "refresh_token"
    });

    const resp = await http.post(url, params, {
      headers: { "content-type": "application/x-www-form-urlencoded" }
    });

    const accessToken = resp.data?.access_token as string | undefined;
    const expiresIn = Number(resp.data?.expires_in ?? 3600);

    if (!accessToken) throw new Error("Zoho token response missing access_token");

    this.token = { accessToken, expiresAt: now + expiresIn * 1000 };
    return accessToken;
  }

  async upsert(moduleApiName: string, externalIdField: string, record: Record<string, any>): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.cfg.apiBase}/${moduleApiName}/upsert`;

    await http.post(
      url,
      {
        data: [record],
        duplicate_check_fields: [externalIdField]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
          // Optional org header if needed later:
          // ...(this.cfg.orgId ? { "X-CRM-ORG": this.cfg.orgId } : {})
        }
      }
    );

    this.logger.info({ moduleApiName, externalIdField }, "Zoho upsert ok");
  }
}