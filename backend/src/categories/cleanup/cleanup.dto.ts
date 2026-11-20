import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../categories.constants";

/** Far more than any home has categories; protects against oversized requests. */
const MAX_CHANGES = 500;
const KEY_MAX_LENGTH = 4 * CATEGORY_PATH_MAX_LENGTH;

export class CleanupChangeDto {
  /** The category name as it is in HA, e.g. "Büro - Licht". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  from!: string;

  /** The new folder path, e.g. "Büro/Licht". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  to!: string;
}

export class CleanupChangesDto {
  @IsArray()
  @ArrayMaxSize(MAX_CHANGES)
  @ValidateNested({ each: true })
  @Type(() => CleanupChangeDto)
  changes!: CleanupChangeDto[];
}

export class IgnoreProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(KEY_MAX_LENGTH)
  key!: string;
}
