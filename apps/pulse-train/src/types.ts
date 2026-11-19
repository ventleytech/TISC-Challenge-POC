/** Aligns with packages/contracts/events/labels/vp.labels.v1.schema.json */

export type DetectionId =
  | 'crack'
  | 'sag'
  | 'corrosion'
  | 'vegetation'
  | 'thermal_hotspot';

export type LabelerRole =
  | 'energy_operator'
  | 'energy_supervisor'
  | 'utility_admin'
  | 'platform_admin';

/** true = TP (accepted), false = FP (rejected / corrected). */
export type LabelKind = 'tp' | 'fp';

export interface VpLabelBody {
  label_id: string;
  finding_id: string;
  inspection_id?: string;
  class_id: DetectionId;
  accepted?: boolean;
  corrected_class_id?: DetectionId | null;
  labeler_role: LabelerRole;
  notes?: string | null;
}

export interface VpLabelsV1 {
  event_id: string;
  occurred_at: string;
  label: VpLabelBody;
}

export interface DatasetQueueItem {
  label_id: string;
  finding_id: string;
  class_id: DetectionId;
  kind: LabelKind;
  corrected_class_id?: DetectionId | null;
  occurred_at: string;
  event_id: string;
  queued_at: string;
}

export type RetrainJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface RetrainJob {
  id: string;
  status: RetrainJobStatus;
  class_ids: DetectionId[];
  label_count: number;
  enqueued_at: string;
  updated_at: string;
  detail: string;
  model_id?: string;
}

/** Aligns with packages/contracts/events/models/vp.models.v1.schema.json */

export type ModelAction = 'registered' | 'promoted' | 'reload_requested' | 'retired';
export type ModelFormat = 'onnx' | 'tensorrt' | 'ultralytics_pt';

export interface ModelRecord {
  model_id: string;
  class_ids: DetectionId[];
  action: ModelAction;
  artifact_uri: string;
  format?: ModelFormat;
  checksum_sha256?: string | null;
  registered_at: string;
}

export interface VpModelsV1 {
  event_id: string;
  occurred_at: string;
  model: {
    model_id: string;
    class_ids: DetectionId[];
    action: ModelAction;
    artifact_uri: string;
    format?: ModelFormat;
    checksum_sha256?: string | null;
  };
}
