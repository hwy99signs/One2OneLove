import { trackFeatureActionEvent } from './interactionAnalytics';

export function trackFeatureAction(feature, detail) {
  trackFeatureActionEvent(feature, detail);
  return undefined;
}
