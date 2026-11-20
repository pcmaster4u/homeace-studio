import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../../categories/categories.constants";
import { FLOW_KINDS, FLOW_NAME_MAX_LENGTH } from "../editor.constants";
import type { FlowKind } from "../editor.model";

export class CreateFlowDto {
  @IsIn(FLOW_KINDS)
  kind!: FlowKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FLOW_NAME_MAX_LENGTH)
  name!: string;

  /** Folder to put the new flow in, e.g. "Haus/Pool"; omitted or null for none. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  categoryPath?: string | null;
}
