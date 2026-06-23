import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { CreatePlacementDto } from "src/dto/create_placement.dto";
import { RolesGuard } from "src/guards/role.guard";
import { PlacementService } from "src/services/placement.service";

@Controller('placement')

export class PlacementController {
    constructor (
        private placementService: PlacementService
    ) {}

    @Post('/create')
    createPlacement (@Req() req: any, @Body() dto: CreatePlacementDto) {
        return this.placementService.createPlacement(req, dto)
    }
}