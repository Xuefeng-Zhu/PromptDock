export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function formatPrefixedErrorMessage(prefix: string, error: unknown): string {
  return `${prefix}: ${formatErrorMessage(error)}`;
}
