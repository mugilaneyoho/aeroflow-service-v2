import { IsEnum } from 'class-validator';
import { roles } from 'src/entities/role.entity';

export class CreateRoleDto {
  @IsEnum(roles)
  role!: roles;
}
