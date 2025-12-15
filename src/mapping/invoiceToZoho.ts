import type { InvoicePayload } from "../schemas/invoice.js";
import { ExternalIds } from "./externalIds.js";

export function mapInvoiceToAccount(i: InvoicePayload) {
  return {
    [ExternalIds.Accounts]: i.customerCode,
    Account_Name: i.customerCode // TODO: map real customer name when confirmed
  };
}

export function mapInvoiceToInvoiceRecord(i: InvoicePayload) {
  return {
    [ExternalIds.Invoices]: i.invoiceNo,
    Subject: `Invoice ${i.invoiceNo}`,
    Grand_Total: i.total,
    Currency: i.currency
  };
}