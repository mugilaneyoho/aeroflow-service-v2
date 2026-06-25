import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlacementController } from "src/controllers/placement.controller";
import { InterviewFeedback } from "src/entities/interview_feedback.entity";
import { InterviewSchedule } from "src/entities/interview_schedule.entity";
import { InterviewStatus } from "src/entities/interview_status.entity";
import { Placements } from "src/entities/placement.entity";
import { PlacementInvite } from "src/entities/placement_invite.entity";
import { PlacementStatus } from "src/entities/placement_status.entity";
import { join } from "path";
import { RolesGuard } from "src/guards/role.guard";
import { PlacementService } from "src/services/placement.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Placements, PlacementStatus, PlacementInvite, InterviewSchedule, InterviewFeedback, InterviewStatus]),
        ClientsModule.register([
            {
                name: 'NOTIFICATION_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://guest:guest@rabbitmq:5672'],
                    queue: 'notifications',
                    queueOptions: {
                        durable: true
                    }
                }
            },
            {
                name: 'STUDENT_GRPC_SERVICE',
                transport: Transport.GRPC,
                options: {
                    package: 'student',
                    protoPath: join(__dirname, '../proto/student.proto'),
                    url: process.env.INSTITUTE_GRPC || 'localhost:3003',
                }
            }
        ])
],
    controllers: [PlacementController],
    providers: [PlacementService, RolesGuard],
    exports: [PlacementService, RolesGuard]
})

export class PlacementModule {}