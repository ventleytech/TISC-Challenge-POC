import { randomUUID } from 'node:crypto';
import type {
  Alert,
  Asset,
  Finding,
  Inspection,
  Site,
  Utility,
  UtilityMembership,
} from './types';

/**
 * Authoritative domain store for pulse-api.
 * Inspections / assets / findings / alerts are durable when Postgres is wired.
 * Utilities / sites / memberships stay process-local until a later card.
 */
export abstract class DomainStore {
  readonly utilities = new Map<string, Utility>();
  readonly sites = new Map<string, Site>();
  readonly memberships = new Map<string, UtilityMembership>();

  nextId(): string {
    return randomUUID();
  }

  abstract listInspections(opts: {
    utilityId: string;
    status?: string;
  }): Promise<Inspection[]>;

  abstract getInspection(id: string): Promise<Inspection | undefined>;

  abstract createInspection(row: Inspection): Promise<void>;

  abstract listAssets(opts: { utilityId: string }): Promise<Asset[]>;

  abstract getAsset(id: string): Promise<Asset | undefined>;

  abstract createAsset(row: Asset): Promise<void>;

  abstract listAlerts(opts: {
    utilityId: string;
    severity?: string;
  }): Promise<Alert[]>;

  abstract getAlert(id: string): Promise<Alert | undefined>;

  abstract createAlert(row: Alert): Promise<void>;

  abstract listFindings(opts: {
    utilityId: string;
    inspectionId?: string;
  }): Promise<Finding[]>;

  abstract getFinding(id: string): Promise<Finding | undefined>;

  abstract createFinding(row: Finding): Promise<void>;
}
