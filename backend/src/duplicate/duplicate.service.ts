import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { apiError } from "../common/api/api-response";
import { EDITOR_REPOSITORY } from "../editor/editor.constants";
import { FLOW_KIND } from "../editor/editor.model";
import { EditorService } from "../editor/editor.service";
import { FlowsService } from "../editor/flows.service";
import type { EditorRepository } from "../editor/repositories/editor.repository";
import { EntriesService } from "../entries/entries.service";
import { ENTRY_ACTION } from "../entries/entry.model";
import { MESSAGE_ID } from "../messages/message-ids";

/**
 * Copies an automation or script with what HA's own "duplicate" leaves out: folder, labels and
 * area. An automation copy starts switched off, so original and copy do not both react to the
 * same triggers.
 */
@Injectable()
export class DuplicateService {
  constructor(
    private readonly flows: FlowsService,
    private readonly flowEditor: EditorService,
    private readonly entries: EntriesService,
    @Inject(EDITOR_REPOSITORY) private readonly editor: EditorRepository,
  ) {}

  /**
   * @param name - Name of the copy, e.g. "Terrace light (Kopie)"; the UI words it in its language.
   * @throws BadRequestException `FLOW_UNSUPPORTED` / `FLOW_NOT_EDITABLE` like the flow editor.
   */
  async duplicate(entityId: string, name: string): Promise<{ entityId: string }> {
    const { kind, key } = await this.flowEditor.requireStoredFlow(entityId);
    const source = await this.editor.loadStoredConfig(kind, key);
    const entry = (await this.entries.findAll()).find((item) => item.entityId === entityId);

    if (!source || !entry) {
      throw new NotFoundException(apiError(MESSAGE_ID.entryNotFound, { params: { entityId } }));
    }

    const created = await this.flows.create(
      { kind, name, categoryPath: entry.categoryPath ?? undefined },
      source,
    );

    await this.entries.update(created.entityId, {
      labelIds: entry.labels.map((label) => label.labelId),
      areaId: entry.area?.areaId ?? null,
    });
    if (kind === FLOW_KIND.automation) {
      await this.entries.runAction(created.entityId, ENTRY_ACTION.turnOff);
    }

    return created;
  }
}
