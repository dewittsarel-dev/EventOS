export const OPERATOR_REFERENCE_CHECKLIST = [
  {
    id: 'profile',
    title: 'Complete the test company profile',
    description: 'Use a clearly marked test name and your own realistic contact details.',
    href: '/settings/organization',
  },
  {
    id: 'locations',
    title: 'Create inventory locations',
    description: 'Add the warehouse, showroom or storage locations used by the company.',
    href: '/inventory/locations',
  },
  {
    id: 'catalogue',
    title: 'Add real test inventory and photos',
    description: 'Enter stock as a supplier would, using images you own or may legally use.',
    href: '/inventory/items/new',
  },
  {
    id: 'publish',
    title: 'Publish selected Marketplace listings',
    description: 'Publish only customer-facing items and verify private ClientOS data stays private.',
    href: '/settings/marketplace',
  },
  {
    id: 'discover',
    title: 'Test Marketplace discovery and enquiry',
    description: 'Find the published company as a customer and submit a realistic enquiry.',
    href: '/marketplace',
  },
  {
    id: 'plan',
    title: 'Plan a test event',
    description: 'Operate as the planner, create an event and procure from synthetic suppliers.',
    href: '/events/new',
  },
] as const;

export type OperatorReferenceChecklistId =
  (typeof OPERATOR_REFERENCE_CHECKLIST)[number]['id'];

export type OperatorReferenceChecklistState = {
  enabled: boolean;
  completed: OperatorReferenceChecklistId[];
};

export function operatorReferenceStorageKey(organizationId: string): string {
  return `eventos:operator-reference:${organizationId}`;
}

export function loadOperatorReferenceChecklist(
  organizationId: string,
  storage: Pick<Storage, 'getItem'>,
): OperatorReferenceChecklistState {
  const empty: OperatorReferenceChecklistState = { enabled: false, completed: [] };
  const raw = storage.getItem(operatorReferenceStorageKey(organizationId));
  if (!raw) return empty;

  try {
    const value = JSON.parse(raw) as Partial<OperatorReferenceChecklistState>;
    const validIds = new Set(OPERATOR_REFERENCE_CHECKLIST.map(({ id }) => id));
    return {
      enabled: value.enabled === true,
      completed: Array.isArray(value.completed)
        ? value.completed.filter((id): id is OperatorReferenceChecklistId =>
            validIds.has(id as OperatorReferenceChecklistId),
          )
        : [],
    };
  } catch {
    return empty;
  }
}

export function saveOperatorReferenceChecklist(
  organizationId: string,
  state: OperatorReferenceChecklistState,
  storage: Pick<Storage, 'setItem'>,
): void {
  storage.setItem(operatorReferenceStorageKey(organizationId), JSON.stringify(state));
}
