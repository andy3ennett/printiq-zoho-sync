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

export function mapQuoteToQuoteRecord(quote: QuotePayload) {
  return {
    [ExternalIds.Quotes]: quote.quoteNo,
    Subject: `Quote ${quote.quoteNo}`,
    Quote_Stage: quote.status, // TODO: confirm field API name if different
    // In Zoho, Quotes link to Account/Contact/Deal usually via lookups (ids).
    // Phase 0: keep minimal and rely on External IDs only.
    Grand_Total: quote.total,
    Currency: quote.currency
  };
}