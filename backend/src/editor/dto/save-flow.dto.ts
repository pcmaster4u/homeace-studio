import { IsObject } from "class-validator";

export class SaveFlowDto {
  /**
   * The whole config of the automation or script, as the flow endpoint returned it plus the
   * user's edits. Fields the editor does not know must be sent back unchanged.
   */
  @IsObject()
  config!: Record<string, unknown>;
}
