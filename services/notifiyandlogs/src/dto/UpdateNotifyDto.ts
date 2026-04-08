import { PartialType } from "@nestjs/mapped-types";
import { CreateNotifyDto } from "./CreateNotifyDto";


export class UpdateNotificationDto extends PartialType(
    CreateNotifyDto
) {}