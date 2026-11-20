import { IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH, FOLDER_COLOR_PATTERN } from "../categories.constants";

export class SetFolderColorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  path!: string;

  /** "#rrggbb"; null removes the folder's own color. */
  @ValidateIf((dto: SetFolderColorDto) => dto.color !== null)
  @IsString()
  @Matches(FOLDER_COLOR_PATTERN)
  color!: string | null;
}
