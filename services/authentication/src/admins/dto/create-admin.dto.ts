import { IsEnum } from 'class-validator';
import { roles } from 'src/entities/role.entity';

export class CreateAdminDto {
  email!: string;
  name!: string;
  password!: string;
  @IsEnum(roles)
  role!: roles;
}
