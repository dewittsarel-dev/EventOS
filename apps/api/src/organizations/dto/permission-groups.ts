export const ROLE_PERMISSION_GROUPS = [
  'Dashboard',
  'Contacts',
  'Organizations',
  'Meeting Notes',
  'Suppliers',
  'Inventory',
  'Users',
  'Roles',
  'Tasks',
  'Quotations',
  'Calendar',
  'Notifications',
  'Settings',
] as const;

export const ROLE_PERMISSION_ACTIONS = [
  'View',
  'Create',
  'Edit',
  'Delete',
] as const;

export type RolePermissionGroup = (typeof ROLE_PERMISSION_GROUPS)[number];
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export type RolePermissionSet = Record<
  RolePermissionGroup,
  Record<RolePermissionAction, boolean>
>;

export function defaultRolePermissions(): RolePermissionSet {
  return ROLE_PERMISSION_GROUPS.reduce((groupAcc, group) => {
    const nextActionMap = ROLE_PERMISSION_ACTIONS.reduce(
      (actionAcc, action) => {
        actionAcc[action] = false;
        return actionAcc;
      },
      {} as Record<RolePermissionAction, boolean>,
    );

    groupAcc[group] = nextActionMap;
    return groupAcc;
  }, {} as RolePermissionSet);
}
