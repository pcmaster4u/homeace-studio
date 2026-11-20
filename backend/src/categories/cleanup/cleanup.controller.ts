import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { ResponseMessage } from "src/common/api/response-message.decorator";
import { MESSAGE_ID } from "src/messages/message-ids";
import { CleanupChangesDto, IgnoreProposalDto } from "./cleanup.dto";
import {
  CleanupService,
  type CleanupOverview,
  type CleanupResult,
  type CleanupStep,
} from "./cleanup.service";

/** The tidy-up assistant (docs/api.md). Preview and apply are actions, so POST. */
@Controller("categories/cleanup")
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Get()
  overview(): Promise<CleanupOverview> {
    return this.cleanupService.overview();
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: CleanupChangesDto): Promise<{ steps: CleanupStep[] }> {
    return { steps: await this.cleanupService.preview(dto.changes) };
  }

  @Post("apply")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(MESSAGE_ID.cleanupApplied)
  apply(@Body() dto: CleanupChangesDto): Promise<CleanupResult> {
    return this.cleanupService.apply(dto.changes);
  }

  @Post("ignore")
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(MESSAGE_ID.cleanupIgnored)
  async ignore(@Body() dto: IgnoreProposalDto): Promise<null> {
    await this.cleanupService.ignore(dto.key);

    return null;
  }

  @Delete("ignore")
  @ResponseMessage(MESSAGE_ID.cleanupRestored)
  async restoreIgnored(): Promise<null> {
    await this.cleanupService.restoreIgnored();

    return null;
  }
}
