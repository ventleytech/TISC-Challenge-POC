import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, type QueryResultRow } from 'pg';
import { DomainStore } from './domain.store';
import type {
  Alert,
  Asset,
  Criticality,
  Inspection,
  InspectionStatus,
  Severity,
} from './types';

@Injectable()
export class PostgresStore extends DomainStore implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresStore.name);
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    super();
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('Postgres pool ready');
  }

  async listInspections(opts: {
    utilityId: string;
    status?: string;
  }): Promise<Inspection[]> {
    const params: unknown[] = [opts.utilityId];
    let sql =
      'SELECT id, utility_id, status, asset_ids, planned_at FROM inspections WHERE utility_id = $1';
    if (opts.status) {
      params.push(opts.status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ' ORDER BY id';
    const res = await this.pool.query(sql, params);
    return res.rows.map(mapInspection);
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const res = await this.pool.query(
      'SELECT id, utility_id, status, asset_ids, planned_at FROM inspections WHERE id = $1',
      [id],
    );
    const row = res.rows[0];
    return row ? mapInspection(row) : undefined;
  }

  async createInspection(row: Inspection): Promise<void> {
    await this.pool.query(
      `INSERT INTO inspections (id, utility_id, status, asset_ids, planned_at)
       VALUES ($1, $2, $3, $4::uuid[], $5)`,
      [
        row.id,
        row.utility_id,
        row.status,
        row.asset_ids ?? [],
        row.planned_at ?? null,
      ],
    );
  }

  async listAssets(opts: { utilityId: string }): Promise<Asset[]> {
    const res = await this.pool.query(
      `SELECT id, utility_id, name, site_id, criticality, voltage_class
       FROM assets WHERE utility_id = $1 ORDER BY id`,
      [opts.utilityId],
    );
    return res.rows.map(mapAsset);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const res = await this.pool.query(
      `SELECT id, utility_id, name, site_id, criticality, voltage_class
       FROM assets WHERE id = $1`,
      [id],
    );
    const row = res.rows[0];
    return row ? mapAsset(row) : undefined;
  }

  async createAsset(row: Asset): Promise<void> {
    await this.pool.query(
      `INSERT INTO assets (id, utility_id, name, site_id, criticality, voltage_class)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        row.id,
        row.utility_id,
        row.name,
        row.site_id ?? null,
        row.criticality ?? null,
        row.voltage_class ?? null,
      ],
    );
  }

  async listAlerts(opts: {
    utilityId: string;
    severity?: string;
  }): Promise<Alert[]> {
    const params: unknown[] = [opts.utilityId];
    let sql = `SELECT id, finding_id, utility_id, severity, inspection_id, sla_due_at, ack_at
               FROM alerts WHERE utility_id = $1`;
    if (opts.severity) {
      params.push(opts.severity);
      sql += ` AND severity = $${params.length}`;
    }
    sql += ' ORDER BY id';
    const res = await this.pool.query(sql, params);
    return res.rows.map(mapAlert);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const res = await this.pool.query(
      `SELECT id, finding_id, utility_id, severity, inspection_id, sla_due_at, ack_at
       FROM alerts WHERE id = $1`,
      [id],
    );
    const row = res.rows[0];
    return row ? mapAlert(row) : undefined;
  }

  async createAlert(row: Alert): Promise<void> {
    await this.pool.query(
      `INSERT INTO alerts (id, finding_id, utility_id, severity, inspection_id, sla_due_at, ack_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        row.id,
        row.finding_id,
        row.utility_id,
        row.severity,
        row.inspection_id ?? null,
        row.sla_due_at ?? null,
        row.ack_at ?? null,
      ],
    );
  }
}

function mapInspection(row: QueryResultRow): Inspection {
  const assetIds = Array.isArray(row.asset_ids)
    ? row.asset_ids.map(String)
    : [];
  return {
    id: String(row.id),
    utility_id: String(row.utility_id),
    status: row.status as InspectionStatus,
    asset_ids: assetIds,
    planned_at: toIsoOrNull(row.planned_at),
  };
}

function mapAsset(row: QueryResultRow): Asset {
  const asset: Asset = {
    id: String(row.id),
    utility_id: String(row.utility_id),
    name: String(row.name),
    site_id: row.site_id != null ? String(row.site_id) : null,
    voltage_class: row.voltage_class != null ? String(row.voltage_class) : null,
  };
  if (row.criticality != null) {
    asset.criticality = row.criticality as Criticality;
  }
  return asset;
}

function mapAlert(row: QueryResultRow): Alert {
  const alert: Alert = {
    id: String(row.id),
    finding_id: String(row.finding_id),
    utility_id: String(row.utility_id),
    severity: row.severity as Severity,
    sla_due_at: toIsoOrNull(row.sla_due_at),
    ack_at: toIsoOrNull(row.ack_at),
  };
  if (row.inspection_id != null) {
    alert.inspection_id = String(row.inspection_id);
  }
  return alert;
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
