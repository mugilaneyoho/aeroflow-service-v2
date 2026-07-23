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
import { PasswordResetEntity } from './entities/password_reset_token.entity';
import { RolesModule } from './roles/roles.module';
import { ConfigModule } from '@nestjs/config';
import { SeedingService } from './seeding/seeding.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryRpcFilter } from './sentry-exception.filter';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    SentryModule.forRoot(),
    JwtModule.register({
      secret: 'auth-key',
      signOptions: { expiresIn: '30d' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      //for development only
      // url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [
        StudentEntity,
        TelecallingEntity,
        StaffEntity,
        rolesEntity,
        AdminEntity,
        PasswordResetEntity,
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
  providers: [
    AppService,
    SeedingService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useClass: SentryRpcFilter,
    },
  ],
})
export class AppModule {}
