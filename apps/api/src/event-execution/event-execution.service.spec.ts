import { NotImplementedException } from '@nestjs/common';
import { EventExecutionService } from './event-execution.service';

describe('EventExecutionService', () => {
  let service: EventExecutionService;

  beforeEach(() => {
    service = new EventExecutionService();
  });

  it('lists the phase 1 event execution capability actions', () => {
    const actions = service.listSupportedActions();

    expect(actions.map((entry) => entry.action)).toEqual([
      'event-execution.create',
      'event-execution.build-plan',
      'event-execution.reserve-resources',
      'event-execution.release-resources',
      'event-execution.generate-purchase-orders',
      'event-execution.generate-supplier-bookings',
      'event-execution.assign-tasks',
      'event-execution.dispatch',
      'event-execution.collect',
      'event-execution.complete',
      'event-execution.cancel',
      'event-execution.archive',
    ]);
  });

  it('keeps execution methods as explicit phase 1 placeholders', async () => {
    await expect(
      service.createExecution({
        organizationId: 'org-1',
        eventId: 'event-1',
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });
});
