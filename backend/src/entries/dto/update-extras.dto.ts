import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

const NOTE_MAX_LENGTH = 2000;

export class UpdateExtrasDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  /** Blank or null removes the note. */
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_MAX_LENGTH)
  note?: string | null;
}
