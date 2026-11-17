import { Injectable } from '@nestjs/common';
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
 * shortcut: process-local Maps only — ceiling is single-instance demos.
 * Upgrade path: Postgres repositories when data-plane persistence card lands.
 */
@Injectable()
export class MemoryStore {
  readonly inspections = new Map<string, Inspection>();
  readonly assets = new Map<string, Asset>();
  readonly findings = new Map<string, Finding>();
  readonly alerts = new Map<string, Alert>();
  readonly utilities = new Map<string, Utility>();
  readonly sites = new Map<string, Site>();
  readonly memberships = new Map<string, UtilityMembership>();

  nextId(): string {
    return randomUUID();
  }
}
