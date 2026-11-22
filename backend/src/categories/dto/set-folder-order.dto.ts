import { ArrayMaxSize, IsArray, IsString, MaxLength } from "class-validator";

import { CATEGORY_PATH_MAX_LENGTH } from "../categories.constants";

/** More siblings than this is not a tree people sort by hand. */
const SIBLINGS_MAX = 500;

export class SetFolderOrderDto {
  /** The parent folder; "" for the top level. */
  @IsString()
  @MaxLength(CATEGORY_PATH_MAX_LENGTH)
  parent!: string;

  /** Its direct subfolders in the wanted order; empty goes back to A–Z. */
  @IsArray()
  @ArrayMaxSize(SIBLINGS_MAX)
  @IsString({ each: true })
  @MaxLength(CATEGORY_PATH_MAX_LENGTH, { each: true })
  order!: string[];
}
