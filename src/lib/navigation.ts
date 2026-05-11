import type { Role, RoleScreen, RoleTab } from '@/lib/vault';

export function getRoleHomePath(role: Role): string {
  return `/${role}`;
}

export function getScreenPath(role: Role, screenKey: string): string {
  return `/${role}/${screenKey}`;
}

export function getTabPath(
  role: Role,
  tab: Pick<RoleTab, 'key'>,
  screens?: Record<string, RoleScreen>,
): string {
  if (!screens) {
    return getRoleHomePath(role);
  }

  const firstScreen = Object.entries(screens)
    .filter(([, screen]) => screen.tab === tab.key)
    .sort(([, a], [, b]) => a.order - b.order)[0];

  return firstScreen
    ? getScreenPath(role, firstScreen[0])
    : getRoleHomePath(role);
}

export function getActiveTabKey(
  role: Role,
  pathname: string,
  screens?: Record<string, RoleScreen>,
): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== role) {
    return null;
  }

  const currentSegment = segments[1];
  if (!currentSegment) {
    return null;
  }

  if (screens?.[currentSegment]) {
    return screens[currentSegment].tab;
  }

  return currentSegment;
}

export function getScreensForTab(
  tabKey: string | null,
  screens: Record<string, RoleScreen>,
): Array<[string, RoleScreen]> {
  return Object.entries(screens)
    .filter(([, screen]) => screen.tab === tabKey)
    .sort(([, a], [, b]) => a.order - b.order);
}
