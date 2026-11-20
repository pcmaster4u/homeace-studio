import { IsNotEmpty, IsString, MaxLength, ValidateIf } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../../categories/categories.constants";

export class MoveEntryDto {
  /** Target folder like "Haus/Pool"; null takes the entry out of every category. */
  @ValidateIf((dto: MoveEntryDto) => dto.categoryPath !== null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  categoryPath!: string | null;
}
