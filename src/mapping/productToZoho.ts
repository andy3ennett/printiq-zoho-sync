import type { ProductPayload } from "../schemas/product.js";
import { ExternalIds } from "./externalIds.js";

export function mapProductToZoho(p: ProductPayload) {
  return {
    [ExternalIds.Products]: p.productCode,
    Product_Name: p.name,
    Unit_Price: p.unitPrice,
    Product_Active: p.active
  };
}