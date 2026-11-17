export type StoreBackend = 'fs' | 'minio';

export interface PutResult {
  key: string;
  etag?: string;
  backend: StoreBackend;
}

export interface GetResult {
  key: string;
  body: Buffer;
  contentType?: string;
  backend: StoreBackend;
}

export interface ObjectStore {
  readonly backend: StoreBackend;
  put(key: string, body: Buffer | string, contentType?: string): Promise<PutResult>;
  get(key: string): Promise<GetResult>;
  exists(key: string): Promise<boolean>;
}
