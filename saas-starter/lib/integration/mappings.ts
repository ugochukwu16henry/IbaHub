export type IntegrationMappings = {
  logisticsOrgId?: string | null;
  gigOrgId?: string | null;
  retailOrgId?: string | null;
};

export function parseIntegrationMappings(
  raw: string | null | undefined
): IntegrationMappings | null {
  if (!raw?.trim()) return null;
  try {
    const v = JSON.parse(raw) as IntegrationMappings;
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

export function serializeIntegrationMappings(
  m: IntegrationMappings
): string {
  return JSON.stringify(m);
}
