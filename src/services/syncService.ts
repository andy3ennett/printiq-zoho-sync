import type { Logger } from "pino";
import type { IZohoClient } from "../zoho/ZohoClient.js";
import type { QuotePayload } from "../schemas/quote.js";
import type { AcceptancePayload } from "../schemas/acceptance.js";
import type { ProductPayload } from "../schemas/product.js";
import type { InvoicePayload } from "../schemas/invoice.js";
import { ExternalIds } from "../mapping/externalIds.js";
import {
  mapQuoteToAccount,
  mapQuoteToContact,
  mapQuoteToDeal,
  mapQuoteToQuoteRecord
} from "../mapping/quoteToZoho.js";
import { mapAcceptanceToDealUpdate, mapAcceptanceToSalesOrder } from "../mapping/acceptanceToZoho.js";
import { mapProductToZoho } from "../mapping/productToZoho.js";
import { mapInvoiceToAccount, mapInvoiceToInvoiceRecord } from "../mapping/invoiceToZoho.js";

export class SyncService {
  constructor(private readonly zoho: IZohoClient, private readonly logger: Logger) {}

  async syncQuote(payload: QuotePayload) {
    // Minimal, Phase 0: upsert core entities by External ID only.
    await this.zoho.upsert("Accounts", ExternalIds.Accounts, mapQuoteToAccount(payload));

    const contact = mapQuoteToContact(payload);
    if (contact) {
      await this.zoho.upsert("Contacts", ExternalIds.Contacts, contact);
    }

    await this.zoho.upsert("Deals", ExternalIds.Deals, mapQuoteToDeal(payload));
    await this.zoho.upsert("Quotes", ExternalIds.Quotes, mapQuoteToQuoteRecord(payload));

    this.logger.info({ quoteNo: payload.quoteNo }, "Quote sync completed");
  }

  async syncAcceptance(payload: AcceptancePayload) {
    await this.zoho.upsert("Deals", ExternalIds.Deals, mapAcceptanceToDealUpdate(payload));

    const so = mapAcceptanceToSalesOrder(payload);
    if (so) {
      await this.zoho.upsert("Sales_Orders", ExternalIds.SalesOrders, so);
    }

    this.logger.info({ quoteNo: payload.quoteNo }, "Acceptance sync completed");
  }

  async syncProduct(payload: ProductPayload) {
    await this.zoho.upsert("Products", ExternalIds.Products, mapProductToZoho(payload));
    this.logger.info({ productCode: payload.productCode }, "Product sync completed");
  }

  async syncInvoice(payload: InvoicePayload) {
    await this.zoho.upsert("Accounts", ExternalIds.Accounts, mapInvoiceToAccount(payload));
    await this.zoho.upsert("Invoices", ExternalIds.Invoices, mapInvoiceToInvoiceRecord(payload));
    this.logger.info({ invoiceNo: payload.invoiceNo }, "Invoice sync completed");
  }
}