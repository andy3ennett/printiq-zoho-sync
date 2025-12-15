/**
 * External ID field API names in Zoho (assumed to exist as custom External ID fields).
 * IMPORTANT: These MUST match your Zoho field API names exactly.
 */
export const ExternalIds = {
  Accounts: "PrintIQ_CustomerCode",
  Contacts: "PrintIQ_ContactID",
  Deals: "PrintIQ_QuoteNo",
  Quotes: "PrintIQ_QuoteNo",
  SalesOrders: "PrintIQ_JobReference",
  Invoices: "PrintIQ_InvoiceNo",
  Products: "PrintIQ_ProductCode"
} as const;