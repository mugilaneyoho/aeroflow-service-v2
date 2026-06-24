import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CreatePlacementDto } from "src/dto/create_placement.dto";
import { InterviewStatusDto } from "src/dto/interview_status.dto";
import { PlacementInviteDto } from "src/dto/placement_invite.dto";
import { ScheduleInterviewDto } from "src/dto/schedule_interview.dto";
import { updatePlacementInviteDto } from "src/dto/update_placement_invite.,dto";
import { Roles } from "src/guards/role.decorator";
import { Role } from "src/guards/role.enum";
import { PlacementService } from "src/services/placement.service";

@Controller('placement')

export class PlacementController {
    constructor(
        private placementService: PlacementService
    ) { }

    @Post('create')
    createPlacement(@Req() req: any, @Body() dto: CreatePlacementDto) {
        return this.placementService.createPlacement(req, dto)
    }

    @Post('invite')
    invitePlacement(@Req() req: any, @Body() dto: PlacementInviteDto) {
        return this.placementService.invitePlacement(req, dto)
    }

    @Get('invite/:id')
    getPlacementInviteById(@Param('id') id: string) {
        return this.placementService.getInvitePlacementById(id);
    }

    @Get('invite')
    getAllInvitePlacements( @Query('page') page = 1, @Query('limit') limit = 10,) {
        return this.placementService.getAllInvitePlacements(Number(page), Number(limit));
    }

    @Get(':id')
    getPlacementById(@Param('id') id: string) {
        return this.placementService.getPlacementById(id);
    }

    @Get()
    getAllPlacements( @Query('page') page = 1, @Query('limit') limit = 10,) {
        return this.placementService.getAllPlacements(Number(page), Number(limit));
    }

    @Patch(':id')
    updatePlacement(@Param('id') id: string, @Body() dto: CreatePlacementDto,) {
        return this.placementService.updatePlacement(id, dto);
    }

    @Delete(':id')
    deletePlacement(@Param('id') id: string) {
        return this.placementService.deletePlacement(id);
    }

    @Post('interview/schedule')
    scheduleInterview (@Req() req: any, @Body() dto: ScheduleInterviewDto) {
        return this.placementService.scheduleInterview(req, dto);
    }

    @Roles([Role.STUDENT])
    @Patch('invite/:id')
    updateInvite(@Param('id') id: string, @Body() dto: updatePlacementInviteDto) {
        return this.placementService.updatePlacementInvite(id, dto)
    }

    @Patch('interview/status/:id')
    updateInterviewStatus(@Param('id') id: string, @Body() dto: InterviewStatusDto) {
        return this.placementService.updateInterviewStatus(id, dto)
    }
}