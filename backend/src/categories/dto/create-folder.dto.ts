import { IsNotEmpty, IsString, MaxLength } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../categories.constants";

export class CreateFolderDto {
  /** Full folder path, e.g. "Haus/Pool". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  path!: string;
}
