import { IsEnum } from 'class-validator';
import { roles } from 'src/entities/role.entity';

export class UpdateRoleDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsEnum(roles)
  role: roles;
}
