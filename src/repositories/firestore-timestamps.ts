export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export type FirestoreDateValue = FirestoreTimestamp | Date | null | undefined;

/**
 * Convert a Date to a Firestore Timestamp-like object without loading Firebase.
 * Tests use this plain shape while production writes still use Firebase Timestamp.
 */
export function dateToTimestamp(date: Date): FirestoreTimestamp {
  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000);
  const nanoseconds = (ms % 1000) * 1_000_000;
  return {
    seconds,
    nanoseconds,
    toDate: () => new Date(seconds * 1000 + nanoseconds / 1_000_000),
  };
}

/**
 * Convert Firestore Timestamp values, Date instances, and absent fields to Date.
 */
export function timestampToDate(timestamp: FirestoreDateValue): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (
    typeof timestamp.seconds === 'number' &&
    typeof timestamp.nanoseconds === 'number'
  ) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000);
  }
  return new Date();
}

export function nullableTimestampToDate(timestamp: FirestoreDateValue): Date | null {
  return timestamp ? timestampToDate(timestamp) : null;
}
