import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from "class-validator";

import { AREA_ICON_PATTERN, AREA_NAME_MAX_LENGTH } from "../areas.constants";

/** Missing fields stay as they are. */
export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(AREA_NAME_MAX_LENGTH)
  name?: string;

  /** "mdi:sofa"; null removes the icon. */
  @IsOptional()
  @ValidateIf((dto: UpdateAreaDto) => dto.icon !== null)
  @IsString()
  @Matches(AREA_ICON_PATTERN)
  icon?: string | null;
}
