// Fallback demo data used by the OCR structured viewer when the backend
// has not provided real `fields` yet. Source: data-test/data-test.js
import { dataTest } from "@/data-test/data-test";

type DemoEntry = {
  doc_type?: string;
  schema_code?: string;
  fields?: Record<string, unknown>;
};

export const DEMO_FIELDS_BY_DOC_TYPE: Record<string, Record<string, unknown>> = (
  dataTest as DemoEntry[]
).reduce<Record<string, Record<string, unknown>>>((acc, entry) => {
  if (entry?.doc_type && entry?.fields) {
    acc[entry.doc_type] = entry.fields;
  }
  return acc;
}, {});
