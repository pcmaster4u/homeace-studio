import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { apiError } from "src/common/api/api-response";
import { MESSAGE_ID } from "src/messages/message-ids";
import { CATEGORY_SCOPE } from "../categories/categories.constants";
import { CategoriesService } from "../categories/categories.service";
import { removeExtras } from "../entries/entry-extras";
import { OVERLAY_REPOSITORY } from "../overlay/overlay.constants";
import type { OverlayRepository } from "../overlay/repositories/overlay.repository";
import type { CreateHelperDto } from "./dto/create-helper.dto";
import { buildHelperPayload, HelperSettingsError } from "./helper-payload";
import {
  ENTITY_LOOKUP_ATTEMPTS,
  ENTITY_LOOKUP_DELAY_MS,
  ENTITY_LOOKUP_WAIT,
  HELPER_REPOSITORY,
  HELPER_TYPES,
  type HelperType,
} from "./helpers.constants";
import type { HelperRepository } from "./repositories/helper.repository";

const ENTITY_ID_SEPARATOR = ".";

@Injectable()
export class HelpersService {
  private readonly logger = new Logger(HelpersService.name);

  constructor(
    @Inject(HELPER_REPOSITORY) private readonly helpers: HelperRepository,
    private readonly categories: CategoriesService,
    @Inject(OVERLAY_REPOSITORY) private readonly overlay: OverlayRepository,
    @Inject(ENTITY_LOOKUP_WAIT) private readonly pause: (milliseconds: number) => Promise<void>,
  ) {}

  /**
   * Creates a helper in HA and, if a folder is given, sorts it in right away.
   *
   * @returns The entity ID of the new helper, e.g. "input_boolean.gaestemodus".
   */
  async create(dto: CreateHelperDto): Promise<{ entityId: string }> {
    const payload = this.toPayload(dto);
    const helperId = await this.helpers.create(dto.type, payload);
    const entityId = await this.waitForEntityId(dto.type, helperId);

    if (!entityId) {
      // The helper exists; only the folder could not be set. Fall back to HA's usual ID scheme.
      this.logger.warn(`Entity of new ${dto.type} "${helperId}" not found; category not set`);
      return { entityId: dto.type + ENTITY_ID_SEPARATOR + helperId };
    }

    if (dto.categoryPath) {
      await this.categories.assign({
        entityId,
        scope: CATEGORY_SCOPE.helpers,
        currentCategoryId: null,
        targetPath: dto.categoryPath,
      });
    }

    this.logger.log(`Created ${entityId}`);

    return { entityId };
  }

  /**
   * Deletes a helper in HA, then its own extras and its category if that became empty.
   *
   * @throws BadRequestException `HELPER_NOT_DELETABLE` for helpers that are config entries
   *   (template, group, …); those have their own delete flow in HA.
   */
  async delete(entityId: string): Promise<void> {
    const registration = await this.helpers.findRegistration(entityId);

    if (!registration) {
      throw new NotFoundException(apiError(MESSAGE_ID.entryNotFound, { params: { entityId } }));
    }

    const type = HELPER_TYPES.find((helperType) => helperType === registration.platform);

    if (!type) {
      throw new BadRequestException(
        apiError(MESSAGE_ID.helperNotDeletable, { params: { entityId } }),
      );
    }

    await this.helpers.remove(type, registration.uniqueId);
    await this.overlay.update((overlay) => removeExtras(overlay, entityId));

    if (registration.categoryId) {
      await this.categories.cleanUp(CATEGORY_SCOPE.helpers, registration.categoryId);
    }

    this.logger.log(`Deleted ${entityId}`);
  }

  private toPayload(dto: CreateHelperDto): Record<string, unknown> {
    try {
      return buildHelperPayload(dto.type, dto.name.trim(), dto.icon?.trim(), dto.settings ?? {});
    } catch (error) {
      if (error instanceof HelperSettingsError) {
        throw new BadRequestException(
          apiError(MESSAGE_ID.helperSettingsInvalid, { params: { field: error.field } }),
        );
      }

      throw error;
    }
  }

  /** HA registers the entity a moment after the helper; ask a few times. */
  private async waitForEntityId(type: HelperType, helperId: string): Promise<string | null> {
    for (let attempt = 0; attempt < ENTITY_LOOKUP_ATTEMPTS; attempt++) {
      const entityId = await this.helpers.findEntityId(type, helperId);

      if (entityId) return entityId;

      await this.pause(ENTITY_LOOKUP_DELAY_MS);
    }

    return null;
  }
}
