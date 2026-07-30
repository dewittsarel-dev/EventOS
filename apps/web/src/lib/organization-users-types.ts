export type OrganizationUserRole = 'Administrator' | 'Manager' | 'Staff';

export type OrganizationUserStatus = 'Active' | 'Disabled';

export type OrganizationUserRecord = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  role: OrganizationUserRole;
  status: OrganizationUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationUserListResponse = {
  data: OrganizationUserRecord[];
};

export type InviteOrganizationUserPayload = {
  name?: string;
  email: string;
  role: OrganizationUserRole;
};

export type UpdateOrganizationUserPayload = {
  name?: string;
  email: string;
  role: OrganizationUserRole;
};
