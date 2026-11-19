import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  exportWorkOrders,
  type AssetInput,
  type BuildWorkOrderOptions,
  type FindingInput,
  type PartyHintInput,
  type WorkOrderExport,
  type WorkOrderSource,
} from '@voltpulse/work-order';
import { DomainStore } from '../domain/domain.store';
import type { Asset } from '../domain/types';
import type {
  AssetOverrideBody,
  WorkOrderExportBody,
  WorkOrderExportItemBody,
} from './work-orders.types';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly store: DomainStore) {}

  async exportFromBody(body: WorkOrderExportBody): Promise<WorkOrderExport> {
    if (!body?.utility_id) {
      throw new BadRequestException('utility_id is required');
    }
    if (!Array.isArray(body.items)) {
      throw new BadRequestException('items array is required');
    }

    const sources: WorkOrderSource[] = [];
    for (let index = 0; index < body.items.length; index += 1) {
      sources.push(await this.toSource(body.utility_id, body.items[index], index));
    }

    const options: BuildWorkOrderOptions = {};
    if (body.exported_at != null && String(body.exported_at).length > 0) {
      options.exportedAt = String(body.exported_at);
    }
    if (body.id_prefix != null && String(body.id_prefix).trim().length > 0) {
      options.idPrefix = String(body.id_prefix).trim();
    }

    try {
      return exportWorkOrders(sources, options);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`work-order export failed: ${message}`);
    }
  }

  private async toSource(
    utilityId: string,
    item: WorkOrderExportItemBody,
    index: number,
  ): Promise<WorkOrderSource> {
    if (!item?.finding?.finding_id) {
      throw new BadRequestException(
        `items[${index}].finding.finding_id is required`,
      );
    }
    if (!item.finding.class_id || !item.finding.severity) {
      throw new BadRequestException(
        `items[${index}].finding.class_id and severity are required`,
      );
    }
    if (!item.party_hint?.party_type) {
      throw new BadRequestException(
        `items[${index}].party_hint.party_type is required`,
      );
    }

    const finding: FindingInput = {
      finding_id: item.finding.finding_id,
      inspection_id: item.finding.inspection_id ?? null,
      class_id: item.finding.class_id as FindingInput['class_id'],
      severity: item.finding.severity as FindingInput['severity'],
      risk_score: item.finding.risk_score ?? null,
      asset_id: item.finding.asset_id ?? item.asset_id ?? null,
      recommendation: item.finding.recommendation ?? null,
    };

    const partyHint: PartyHintInput = {
      party_type: item.party_hint.party_type as PartyHintInput['party_type'],
      warranty_hint: item.party_hint.warranty_hint ?? null,
      tender_ref: item.party_hint.tender_ref ?? null,
    };

    const asset = await this.resolveAsset(utilityId, finding, item, index);
    return { finding, asset, partyHint };
  }

  private async resolveAsset(
    utilityId: string,
    finding: FindingInput,
    item: WorkOrderExportItemBody,
    index: number,
  ): Promise<AssetInput | null> {
    const lookupId =
      (item.asset_id && String(item.asset_id)) ||
      (finding.asset_id && String(finding.asset_id)) ||
      (item.asset?.id && String(item.asset.id)) ||
      '';

    let fromStore: Asset | undefined;
    if (lookupId) {
      fromStore = await this.store.getAsset(lookupId);
      if (!fromStore && !item.asset) {
        throw new NotFoundException(
          `items[${index}]: asset ${lookupId} not found`,
        );
      }
      if (fromStore && fromStore.utility_id !== utilityId) {
        throw new BadRequestException(
          `items[${index}]: asset ${lookupId} utility_id mismatch`,
        );
      }
    }

    if (!fromStore && !item.asset) {
      return null;
    }

    const override: AssetOverrideBody = item.asset ?? {};
    const id = override.id || fromStore?.id || lookupId;
    if (!id) {
      return null;
    }

    const resolvedUtility =
      override.utility_id ?? fromStore?.utility_id ?? utilityId;
    if (resolvedUtility && resolvedUtility !== utilityId) {
      throw new BadRequestException(
        `items[${index}]: asset utility_id must match request utility_id`,
      );
    }

    return {
      id,
      name: override.name ?? fromStore?.name ?? '',
      utility_id: utilityId,
      criticality: override.criticality ?? fromStore?.criticality ?? '',
      voltage_class:
        override.voltage_class ?? fromStore?.voltage_class ?? '',
      oem: override.oem ?? '',
    };
  }
}
