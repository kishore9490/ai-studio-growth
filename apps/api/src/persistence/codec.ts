import { Prisma } from '@prisma/client';
import type { ModelShape } from './model-map.js';

/**
 * Domain record → database row.
 *
 * The domain speaks ISO strings and plain objects; PostgreSQL wants `Date`,
 * typed columns and JSON. Conversion is driven entirely by the schema's field
 * metadata, and any property the schema does not declare is dropped rather than
 * passed through — an undeclared column would otherwise fail the whole write.
 */
export function toRow(shape: ModelShape, record: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const field = shape.scalars.get(key);
    if (!field) continue;

    if (value === undefined || value === null) {
      // A required column keeps its default rather than being nulled out.
      if (field.isRequired) continue;
      row[key] = null;
      continue;
    }

    if (field.type === 'DateTime') {
      row[key] = value instanceof Date ? value : new Date(String(value));
      continue;
    }

    if (field.type === 'Json') {
      row[key] = value as Prisma.InputJsonValue;
      continue;
    }

    if (field.type === 'Int' || field.type === 'Float') {
      row[key] = Number(value);
      continue;
    }

    row[key] = value;
  }

  return row;
}

/**
 * Database row → domain record.
 *
 * The inverse: dates become ISO strings and SQL nulls become absent properties,
 * because the domain models "not set" as `undefined` and a literal `null` would
 * defeat every `?? fallback` in the services.
 */
export function toRecord(shape: ModelShape, row: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    const field = shape.scalars.get(key);
    if (!field) continue;
    if (value === null) continue;

    if (value instanceof Date) {
      record[key] = value.toISOString();
      continue;
    }

    if (field.type === 'Decimal' && value && typeof value === 'object' && 'toNumber' in value) {
      record[key] = (value as { toNumber(): number }).toNumber();
      continue;
    }

    record[key] = value;
  }

  return record;
}
