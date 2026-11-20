import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

import { HELPER_NAME_MAX_LENGTH, ICON_MAX_LENGTH } from "../../helpers/helpers.constants";

/** Every field is optional; missing ones stay. A blank name or icon goes back to the default. */
export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(HELPER_NAME_MAX_LENGTH)
  name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(ICON_MAX_LENGTH)
  icon?: string | null;

  @IsOptional()
  @IsString()
  areaId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
