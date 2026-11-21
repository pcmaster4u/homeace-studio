import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

/** HA allows long IDs; this keeps them readable. */
const ENTITY_ID_MAX_LENGTH = 255;

export class RenameEntityDto {
  /** The full new ID, same domain, e.g. "light.patio". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(ENTITY_ID_MAX_LENGTH)
  newEntityId!: string;

  /** Rewrite the automations and scripts that name the old ID. */
  @IsBoolean()
  withReferences!: boolean;
}
