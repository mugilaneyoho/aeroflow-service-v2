import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { WorkSchedule } from './entities/work-schedule.entity';
import { Meeting, MeetingStatus } from './entities/meeting.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { Injectable } from 'node_modules/@nestjs/common';
import { Role } from 'src/role/role.enum';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'reception',
  entities: [ WorkSchedule, Meeting, NotificationLog],
  synchronize: true,
});


@Injectable()
export class SeedClass {
  // async seed() {
  //   console.log('🌱 Starting Database Seeding...');
  //   await AppDataSource.initialize();

  //   const userRepo = AppDataSource.getRepository(User);
  //   const scheduleRepo = AppDataSource.getRepository(WorkSchedule);
  //   const meetingRepo = AppDataSource.getRepository(Meeting);

  //   // 1. Seed Master Admin
  //   let admin = await userRepo.findOne({ where: { email: 'admin@aeroflow.com' } });
  //   if (!admin) {
  //     const hashedPassword = await bcrypt.hash('Admin123!', 10);
  //     admin = userRepo.create({
  //       fullName: 'Master Admin User',
  //       email: 'admin@aeroflow.com',
  //       phone: '+14155552671',
  //       password: hashedPassword,
  //       role: Role.MASTER,
  //     });
  //     await userRepo.save(admin);
  //     console.log('✅ Created Master Admin user (admin@aeroflow.com / Admin123!)');
  //   }

  //   // 2. Seed Receptionist
  //   let receptionist = await userRepo.findOne({ where: { email: 'receptionist@aeroflow.com' } });
  //   if (!receptionist) {
  //     const hashedPassword = await bcrypt.hash('Reception123!', 10);
  //     receptionist = userRepo.create({
  //       fullName: 'Sarah Jenkins (Receptionist)',
  //       email: 'receptionist@aeroflow.com',
  //       phone: '+14155559822',
  //       password: hashedPassword,
  //       role: UserRole.RECEPTIONIST,
  //     });
  //     await userRepo.save(receptionist);
  //     console.log('✅ Created Receptionist user (receptionist@aeroflow.com / Reception123!)');
  //   }

  //   // 3. Seed Today's Work Schedule
  //   const todayStr = new Date().toISOString().split('T')[0];
  //   let schedule = await scheduleRepo.findOne({ where: { workDate: todayStr } });
  //   if (!schedule) {
  //     schedule = scheduleRepo.create({
  //       adminId: admin.id,
  //       workDate: todayStr,
  //       startTime: '09:00',
  //       endTime: '17:00',
  //       breakStart: '13:00',
  //       breakEnd: '14:00',
  //       maxMeetingsPerSlot: 2,
  //       isAvailable: true,
  //     });
  //     await scheduleRepo.save(schedule);
  //     console.log(`✅ Created Work Schedule for ${todayStr} (09:00 - 17:00)`);
  //   }

  //   // 4. Seed Initial Sample Meetings
  //   const sampleMeetingCount = await meetingRepo.count();
  //   if (sampleMeetingCount === 0) {
  //     const m1 = meetingRepo.create({
  //       receptionistId: receptionist.id,
  //       scheduleId: schedule.id,
  //       visitorName: 'David Miller',
  //       visitorCompany: 'Apex Global Logistics',
  //       visitorPhone: '+14155550199',
  //       visitorEmail: 'david.miller@apexlogistics.com',
  //       meetingPurpose: 'Annual Operations Review & Fleet Expansion Plan',
  //       meetingDate: todayStr,
  //       meetingTime: '10:00',
  //       status: MeetingStatus.PENDING,
  //     });

  //     const m2 = meetingRepo.create({
  //       receptionistId: receptionist.id,
  //       scheduleId: schedule.id,
  //       visitorName: 'Elena Rostova',
  //       visitorCompany: 'TechVentures Capital',
  //       visitorPhone: '+14155550288',
  //       visitorEmail: 'elena@techventures.io',
  //       meetingPurpose: 'Strategic Partnership & Investment Consultation',
  //       meetingDate: todayStr,
  //       meetingTime: '11:30',
  //       status: MeetingStatus.CONFIRMED,
  //       adminRemarks: 'Approved. Conference Room B assigned.',
  //       approvedBy: admin.id,
  //       approvedAt: new Date(),
  //     });

  //     await meetingRepo.save([m1, m2]);
  //     console.log('✅ Created sample meeting requests (1 Pending, 1 Confirmed)');
  //   }

  //   console.log('🎉 Seeding complete!');
  //   process.exit(0);
  // }

}


const obj = new SeedClass()

// obj.seed().catch((err) => {
//   console.error('❌ Seeding failed:', err);
//   process.exit(1);
// })