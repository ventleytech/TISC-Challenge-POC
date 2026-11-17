export class LegalHoldError extends Error {
  readonly code = 'LEGAL_HOLD';

  constructor(public readonly key: string) {
    super(`legal hold blocks delete: ${key}`);
    this.name = 'LegalHoldError';
  }
}

export function assertNotOnHold(legalHold: boolean, key: string): void {
  if (legalHold) {
    throw new LegalHoldError(key);
  }
}
