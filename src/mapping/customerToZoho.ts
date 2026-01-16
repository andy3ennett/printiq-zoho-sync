// src/mapping/customerToZoho.ts

export type PrintIQCustomerMinimal = {
  Code: string;
  Id?: number | string;
  // NOTE: keep PII out by default — only use Name if it is already present in webhook payload
  Name?: string;
};

export function mapCustomerToAccountRecord(c: PrintIQCustomerMinimal) {
  const code = c.Code;

  return {
    // External ID (unique) in Zoho
    PrintIQ_CustomerCode: code,

    // Additional identifier
    PrintIQ_CustomerId: c.Id ?? undefined,

    // Phase 0 safe: avoid relying on PrintIQ read calls.
    // If Name is supplied from a webhook payload later, we can use it.
    Account_Name: c.Name?.trim() ? c.Name.trim() : `Customer ${code}`
  };
}