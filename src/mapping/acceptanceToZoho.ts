import type { AcceptancePayload } from "../schemas/acceptance.js";
import { ExternalIds } from "./externalIds.js";

export function mapAcceptanceToDealUpdate(a: AcceptancePayload) {
  return {
    [ExternalIds.Deals]: a.quoteNo,
    Stage: a.status
  };
}

export function mapAcceptanceToSalesOrder(a: AcceptancePayload) {
  if (!a.jobReference) return null;
  return {
    [ExternalIds.SalesOrders]: a.jobReference,
    Subject: `Job ${a.jobReference}`,
    Status: a.status // TODO: confirm desired Sales Order status mapping
  };
}