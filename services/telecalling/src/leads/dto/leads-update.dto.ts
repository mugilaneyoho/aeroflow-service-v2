import { LeadStatus } from 'src/entities/leads.entity';

export class LeadsUpdateDto {
  name: string;
  notes: string;
  status: LeadStatus;
}
