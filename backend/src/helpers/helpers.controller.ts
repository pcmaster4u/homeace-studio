import { Body, Controller, Delete, Param, Post } from "@nestjs/common";

import { ResponseMessage } from "src/common/api/response-message.decorator";
import { MESSAGE_ID } from "src/messages/message-ids";
import { CreateHelperDto } from "./dto/create-helper.dto";
import { HelpersService } from "./helpers.service";

@Controller("helpers")
export class HelpersController {
  constructor(private readonly helpersService: HelpersService) {}

  @Post()
  @ResponseMessage(MESSAGE_ID.helperCreated)
  create(@Body() dto: CreateHelperDto): Promise<{ entityId: string }> {
    return this.helpersService.create(dto);
  }

  @Delete(":entityId")
  @ResponseMessage(MESSAGE_ID.helperDeleted)
  async delete(@Param("entityId") entityId: string): Promise<null> {
    await this.helpersService.delete(entityId);

    return null;
  }
}
