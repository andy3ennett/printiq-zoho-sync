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
  findProductIdByExternalId(externalIdField: string, value: string): Promise<string | null>;

  // NEW: for cases where we need the Zoho id (e.g., quote line items)
  upsertReturnId(
    moduleApiName: string,
    externalIdField: string,
    record: Record<string, any>
  ): Promise<string>;
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

  async findProductIdByExternalId(externalIdField: string, value: string): Promise<string | null> {
    const token = await this.getAccessToken();
    const criteria = `(${externalIdField}:equals:${value})`;
    const url = `${this.cfg.apiBase}/Products/search?criteria=${encodeURIComponent(criteria)}`;

    const resp = await http.get(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });

    const item = resp.data?.data?.[0];
    return item?.id ?? null;
  }

  private async doUpsert(moduleApiName: string, externalIdField: string, record: Record<string, any>) {
    const token = await this.getAccessToken();
    const url = `${this.cfg.apiBase}/${moduleApiName}/upsert`;

    const resp = await http.post(
      url,
      {
        data: [record],
        duplicate_check_fields: [externalIdField]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
        }
      }
    );

    const item = resp.data?.data?.[0];
    if (!item) {
      this.logger.error({ moduleApiName, resp: resp.data }, "Zoho upsert: unexpected response");
      throw new Error("Zoho upsert: unexpected response shape");
    }

    if (item.status !== "success") {
      // Zoho returns structured error details here (e.g. MANDATORY_NOT_FOUND)
      this.logger.error(
        {
          moduleApiName,
          externalIdField,
          code: item.code,
          message: item.message,
          details: item.details,
          record
        },
        "Zoho upsert rejected"
      );

      const err = new Error(
        `Zoho upsert rejected: ${item.code ?? "unknown_code"} ${item.message ?? ""}`.trim()
      );
      (err as any).zohoRejected = true;
      (err as any).zohoCode = item.code;
      throw err;
    }

    this.logger.info(
      { moduleApiName, externalIdField, id: item.details?.id, action: item.details?.action },
      "Zoho upsert ok"
    );

    return item;
  }

  async upsert(moduleApiName: string, externalIdField: string, record: Record<string, any>): Promise<void> {
    await this.doUpsert(moduleApiName, externalIdField, record);
  }

  async upsertReturnId(
    moduleApiName: string,
    externalIdField: string,
    record: Record<string, any>
  ): Promise<string> {
    const item = await this.doUpsert(moduleApiName, externalIdField, record);
    const id = item.details?.id as string | undefined;
    if (!id) {
      throw Object.assign(new Error(`Zoho upsert did not return an id for ${moduleApiName}`), {
        zohoRejected: true
      });
    }
    return id;
  }
}
