import type { QuotePayload } from "../schemas/quote.js";
import { ExternalIds } from "./externalIds.js";

export function mapQuoteToAccount(quote: QuotePayload) {
  return {
    [ExternalIds.Accounts]: quote.customerCode,
    Account_Name: quote.customerCode // TODO: map real customer name when confirmed
  };
}

export function mapQuoteToContact(quote: QuotePayload) {
  if (!quote.contactId) return null;
  return {
    [ExternalIds.Contacts]: quote.contactId,
    Email: quote.contactEmail,
    Last_Name: quote.contactEmail ?? "Unknown" // TODO: map actual name fields
  };
}

export function mapQuoteToDeal(quote: QuotePayload) {
  return {
    [ExternalIds.Deals]: quote.quoteNo,
    Deal_Name: `Quote ${quote.quoteNo}`,
    Stage: quote.status, // TODO: confirm desired mapping to Zoho stage/pipeline
    Amount: quote.total,
    Currency: quote.currency
  };
}

export function mapQuoteToQuoteRecord(
  quote: QuotePayload,
  productIds: { PIQ_CUSTOM_PRINT: string; PIQ_STOCK: string; PIQ_PRINTING: string; PIQ_FINISHING: string }
) {
  const total = quote.total ?? 0;

  // Phase 0: we only have total for now. Later (Phase 1) we can use real breakdown.
  const lines = [
    {
      product: { id: productIds.PIQ_CUSTOM_PRINT },
      quantity: 1,
      list_price: total
    }
  ];

  return {
    [ExternalIds.Quotes]: quote.quoteNo,
    Subject: `Quote ${quote.quoteNo}`,
    Quote_Stage: quote.status,
    Grand_Total: quote.total,
    Currency: quote.currency,
    Product_Details: lines
  };
}

