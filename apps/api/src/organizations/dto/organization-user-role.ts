export const ORGANIZATION_USER_ROLE_VALUES = [
  'Administrator',
  'Manager',
  'Staff',
] as const;

export type OrganizationUserRole =
  (typeof ORGANIZATION_USER_ROLE_VALUES)[number];
