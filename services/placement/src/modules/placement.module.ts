import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlacementController } from "src/controllers/placement.controller";
import { InterviewFeedback } from "src/entities/interview_feedback.entity";
import { InterviewSchedule } from "src/entities/interview_schedule";
import { InterviewStatus } from "src/entities/interview_status";
import { Placements } from "src/entities/placement.entity";
import { PlacementInvite } from "src/entities/placement_invite";
import { PlacementStatus } from "src/entities/placement_status";
import { RolesGuard } from "src/guards/role.guard";
import { PlacementService } from "src/services/placement.service";

@Module({
    imports: [TypeOrmModule.forFeature([Placements, PlacementStatus, PlacementInvite, InterviewSchedule, InterviewFeedback, InterviewStatus])],
    controllers: [PlacementController],
    providers: [PlacementService, RolesGuard],
    exports: [PlacementService, RolesGuard]
})

export class PlacementModule {}