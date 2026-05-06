export type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

function cleanEventParams(params?: AnalyticsEventParams) {
  if (!params) return undefined;

  const cleanParams: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      cleanParams[key] = value;
    }
  }

  return Object.keys(cleanParams).length > 0 ? cleanParams : undefined;
}

function reportAnalyticsError(err: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('Firebase Analytics event was not sent:', err);
  }
}

async function getConfiguredAnalytics() {
  const { getFirebaseAnalytics } = await import('../firebase/config');
  return getFirebaseAnalytics();
}

export async function trackAnalyticsEvent(
  eventName: string,
  params?: AnalyticsEventParams,
): Promise<void> {
  try {
    const analytics = await getConfiguredAnalytics();
    if (!analytics) return;

    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, cleanEventParams(params));
  } catch (err) {
    reportAnalyticsError(err);
  }
}

export function initializeAnalyticsTracking(params?: AnalyticsEventParams): void {
  void trackAnalyticsEvent('promptdock_app_open', params);
}

export function trackScreenView(screenName: string, screenClass = 'PromptDock'): void {
  void trackAnalyticsEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: screenClass,
  });
}

export function trackPromptAction(
  action: 'archived' | 'copied' | 'created' | 'deleted' | 'duplicated' | 'pasted' | 'restored' | 'updated',
  params?: AnalyticsEventParams,
): void {
  void trackAnalyticsEvent(`prompt_${action}`, params);
}
