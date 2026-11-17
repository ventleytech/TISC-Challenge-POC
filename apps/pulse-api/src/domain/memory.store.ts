import { Injectable } from '@nestjs/common';
import { DomainStore } from './domain.store';
import type { Alert, Asset, Finding, Inspection } from './types';

/**
 * Process-local Maps for unit tests / no-DB smoke.
 * Production path uses PostgresStore when PULSE_DATABASE_URL is set.
 */
@Injectable()
export class MemoryStore extends DomainStore {
  private readonly inspections = new Map<string, Inspection>();
  private readonly assets = new Map<string, Asset>();
  private readonly findings = new Map<string, Finding>();
  private readonly alerts = new Map<string, Alert>();

  async listInspections(opts: {
    utilityId: string;
    status?: string;
  }): Promise<Inspection[]> {
    let items = [...this.inspections.values()].filter(
      (i) => i.utility_id === opts.utilityId,
    );
    if (opts.status) {
      items = items.filter((i) => i.status === opts.status);
    }
    return items;
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    return this.inspections.get(id);
  }

  async createInspection(row: Inspection): Promise<void> {
    this.inspections.set(row.id, row);
  }

  async listAssets(opts: { utilityId: string }): Promise<Asset[]> {
    return [...this.assets.values()].filter(
      (a) => a.utility_id === opts.utilityId,
    );
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async createAsset(row: Asset): Promise<void> {
    this.assets.set(row.id, row);
  }

  async listAlerts(opts: {
    utilityId: string;
    severity?: string;
  }): Promise<Alert[]> {
    let items = [...this.alerts.values()].filter(
      (a) => a.utility_id === opts.utilityId,
    );
    if (opts.severity) {
      items = items.filter((a) => a.severity === opts.severity);
    }
    return items;
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(row: Alert): Promise<void> {
    this.alerts.set(row.id, row);
  }

  async listFindings(opts: {
    utilityId: string;
    inspectionId?: string;
  }): Promise<Finding[]> {
    let items = [...this.findings.values()].filter(
      (f) => f.utility_id === opts.utilityId,
    );
    if (opts.inspectionId) {
      items = items.filter((f) => f.inspection_id === opts.inspectionId);
    }
    return items;
  }

  async getFinding(id: string): Promise<Finding | undefined> {
    return this.findings.get(id);
  }

  async createFinding(row: Finding): Promise<void> {
    this.findings.set(row.id, row);
  }
}
