import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstituteEntity } from './entities/institute.entity';
import { BranchEntity } from './entities/branch.entity';
import { CourseEntity } from './entities/course.entity';
import { BatchEntity } from './entities/batch.entity';
import { BranchModule } from './branch/branch.module';
import { CourseModule } from './course/course.module';
import { BatchModule } from './batch/batch.module';
import { StudentModule } from './student/student.module';
import { ConfigModule } from '@nestjs/config';
import { StudentProfileEntity } from './entities/student.entity';
import { RolesGuard } from './role/role.guard';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
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
      // host: process.env.DB_HOST,
      // port: 3306,
      // username: process.env.DB_USER,
      // password: process.env.DB_PASS,
      // database: process.env.DB_NAME,
      entities: [
        InstituteEntity,
        BranchEntity,
        CourseEntity,
        BatchEntity,
        StudentProfileEntity,
      ],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: 'payment',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: join(__dirname, './proto/payment.proto'),
          url: 'payment-service:3011',
        },
      },
    ]),
    TypeOrmModule.forFeature([CourseEntity, BatchEntity, StudentProfileEntity]),
    ProfileModule,
    BranchModule,
    CourseModule,
    BatchModule,
    StudentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
