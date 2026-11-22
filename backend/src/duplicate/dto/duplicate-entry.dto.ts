import { IsNotEmpty, IsString, MaxLength } from "class-validator";

import { HELPER_NAME_MAX_LENGTH } from "../../helpers/helpers.constants";

export class DuplicateEntryDto {
  /** Name of the copy. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(HELPER_NAME_MAX_LENGTH)
  name!: string;
}
