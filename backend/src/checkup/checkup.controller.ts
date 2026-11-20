import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

import { ResponseMessage } from "src/common/api/response-message.decorator";
import { MESSAGE_ID } from "src/messages/message-ids";
import { CheckupService, type CheckupOverview } from "./checkup.service";

const KEY_MAX_LENGTH = 300;

export class IgnoreFindingDto {
  /** e.g. "gone:automation.flur". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(KEY_MAX_LENGTH)
  key!: string;
}

/** The check-up (docs/api.md). */
@Controller("checkup")
export class CheckupController {
  constructor(private readonly checkup: CheckupService) {}

  @Get()
  overview(): Promise<CheckupOverview> {
    return this.checkup.overview();
  }

  @Post("ignore")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(MESSAGE_ID.checkupIgnored)
  async ignore(@Body() dto: IgnoreFindingDto): Promise<null> {
    await this.checkup.ignore(dto.key);

    return null;
  }

  @Delete("ignore")
  @ResponseMessage(MESSAGE_ID.checkupRestored)
  async restore(): Promise<null> {
    await this.checkup.restoreIgnored();

    return null;
  }
}
