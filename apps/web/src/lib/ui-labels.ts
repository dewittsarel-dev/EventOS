const labelOverrides: Record<string, string> = {
  Todo: 'To do',
  InProgress: 'In progress',
  PendingApproval: 'Pending approval',
  PartiallyReceived: 'Partially received',
  FullyReceived: 'Fully received',
  AudioVisual: 'Audio visual',
  EquipmentRental: 'Equipment rental',
};

export function humanizeLabel(value: string) {
  return labelOverrides[value] ?? value.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}
