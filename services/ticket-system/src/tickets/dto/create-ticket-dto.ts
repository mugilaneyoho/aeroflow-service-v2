import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { roles } from '../auth/roles.enum';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional() 
  priority?: string;

  @IsEnum(['open', 'in-progress', 'resolved', 'closed'])
  @IsOptional()
  status?: string;

  @IsEnum(roles)
  @IsNotEmpty()
  assignedToRole: roles;
}
