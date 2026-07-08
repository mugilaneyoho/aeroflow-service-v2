import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import { StudentEntity } from './entities/student.entity';
import { TelecallingModule } from './telecalling/telecalling.module';
import { StaffModule } from './staff/staff.module';
import { AdminsModule } from './admins/admins.module';
import { TelecallingEntity } from './entities/telecalling.entity';
import { StaffEntity } from './entities/staff.entity';
import { rolesEntity } from './entities/role.entity';
import { AdminEntity } from './entities/admins.entity';
import { RolesModule } from './roles/roles.module';
import { ConfigModule } from '@nestjs/config';
import { SeedingService } from './seeding/seeding.service';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [
        StudentEntity,
        TelecallingEntity,
        StaffEntity,
        rolesEntity,
        AdminEntity,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([rolesEntity, AdminEntity]),
    StudentsModule,
    TelecallingModule,
    StaffModule,
    AdminsModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedingService],
})
export class AppModule {}
