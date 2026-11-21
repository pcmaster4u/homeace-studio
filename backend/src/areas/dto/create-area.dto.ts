import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from "class-validator";

import { AREA_ICON_PATTERN, AREA_NAME_MAX_LENGTH } from "../areas.constants";

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(AREA_NAME_MAX_LENGTH)
  name!: string;

  /** "mdi:sofa"; null or missing: no icon. */
  @IsOptional()
  @ValidateIf((dto: CreateAreaDto) => dto.icon !== null)
  @IsString()
  @Matches(AREA_ICON_PATTERN)
  icon?: string | null;
}
