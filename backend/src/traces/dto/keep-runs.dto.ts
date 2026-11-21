import { IsInt, Max, Min } from "class-validator";

import { MAX_STORED_TRACES } from "../traces.constants";

export class KeepRunsDto {
  @IsInt()
  @Min(1)
  @Max(MAX_STORED_TRACES)
  count!: number;
}
