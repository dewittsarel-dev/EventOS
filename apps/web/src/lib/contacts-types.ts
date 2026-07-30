export type ContactRecord = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactListResponse = {
  data: ContactRecord[];
};
