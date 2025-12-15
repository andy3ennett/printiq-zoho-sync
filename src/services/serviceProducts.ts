import type { IZohoClient } from "../zoho/ZohoClient.js";
import { ExternalIds } from "../mapping/externalIds.js";

export type ServiceProductCode =
  | "PIQ_CUSTOM_PRINT"
  | "PIQ_STOCK"
  | "PIQ_PRINTING"
  | "PIQ_FINISHING";

const SERVICE_PRODUCTS: { code: ServiceProductCode; name: string }[] = [
  { code: "PIQ_CUSTOM_PRINT", name: "PrintIQ Custom Print" },
  { code: "PIQ_STOCK", name: "PrintIQ Stock" },
  { code: "PIQ_PRINTING", name: "PrintIQ Printing" },
  { code: "PIQ_FINISHING", name: "PrintIQ Finishing" }
];

export class ServiceProductResolver {
  private cache = new Map<ServiceProductCode, string>();

  constructor(private zoho: IZohoClient) {}

  async getIds(): Promise<Record<ServiceProductCode, string>> {
    const out = {} as Record<ServiceProductCode, string>;
    for (const p of SERVICE_PRODUCTS) {
      out[p.code] = await this.getId(p.code, p.name);
    }
    return out;
  }

  private async getId(code: ServiceProductCode, name: string): Promise<string> {
    const cached = this.cache.get(code);
    if (cached) return cached;

    // Ensure product exists (idempotent upsert)
    await this.zoho.upsert("Products", ExternalIds.Products, {
      [ExternalIds.Products]: code,
      Product_Name: name,
      Product_Active: true
    });

    const id = await this.zoho.findProductIdByExternalId(ExternalIds.Products, code);
    if (!id) {
      throw Object.assign(new Error(`Service product not found after upsert: ${code}`), {
        zohoRejected: true
      });
    }

    this.cache.set(code, id);
    return id;
  }
}