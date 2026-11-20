import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../../categories/categories.constants";
import {
  HELPER_NAME_MAX_LENGTH,
  HELPER_TYPES,
  ICON_MAX_LENGTH,
  type HelperType,
} from "../helpers.constants";

export class CreateHelperDto {
  @IsIn(HELPER_TYPES)
  type!: HelperType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(HELPER_NAME_MAX_LENGTH)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(ICON_MAX_LENGTH)
  icon?: string;

  /** Folder to put the new helper in, e.g. "Haus/Pool"; omitted or null for none. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  categoryPath?: string | null;

  /** Type-specific settings; checked per type in the service (helper-payload.ts). */
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
