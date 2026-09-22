/**
 * Navigation ref
 * --------------
 * A module-level ref so non-component code (notification tap handlers,
 * alert context deep-links) can navigate without prop-drilling.
 */

import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

/** Imperative navigation helper that no-ops until the container is ready. */
export function navigate(name, params) {
  if (!navigationRef.isReady()) return false;
  navigationRef.navigate(name, params);
  return true;
}

export default navigationRef;
