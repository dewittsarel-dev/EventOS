import { IsUUID } from 'class-validator';

export class EventResourceAllocationsQueryDto {
  @IsUUID()
  organizationId: string;
}
