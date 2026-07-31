export const ROLE_PERMISSION_GROUPS = [
  'Dashboard',
  'Contacts',
  'Organizations',
  'Suppliers',
  'Users',
  'Roles',
  'Tasks',
  'Quotations',
  'Calendar',
  'Notifications',
  'Settings',
] as const;

export const ROLE_PERMISSION_ACTIONS = ['View', 'Create', 'Edit', 'Delete'] as const;

export type RolePermissionGroup = (typeof ROLE_PERMISSION_GROUPS)[number];
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export type RolePermissions = Record<RolePermissionGroup, Record<RolePermissionAction, boolean>>;

export type RoleRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  userCount: number;
  isSystem: boolean;
  permissions: RolePermissions;
  createdAt: string;
  updatedAt: string;
};

export type RoleListResponse = {
  data: RoleRecord[];
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  permissions: RolePermissions;
};

export type UpdateRolePayload = {
  name: string;
  description?: string;
  permissions: RolePermissions;
};

export function emptyPermissions(): RolePermissions {
  return ROLE_PERMISSION_GROUPS.reduce((groupAcc, group) => {
    groupAcc[group] = ROLE_PERMISSION_ACTIONS.reduce((actionAcc, action) => {
      actionAcc[action] = false;
      return actionAcc;
    }, {} as Record<RolePermissionAction, boolean>);

    return groupAcc;
  }, {} as RolePermissions);
}
