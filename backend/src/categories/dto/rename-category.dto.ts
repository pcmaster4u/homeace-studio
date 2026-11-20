import { IsNotEmpty, IsString, MaxLength } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../categories.constants";

export class RenameCategoryDto {
  /** Current folder path, e.g. "Haus". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  from!: string;

  /** New folder path, e.g. "Heim" or "Wohnung/Heim". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  to!: string;
}
