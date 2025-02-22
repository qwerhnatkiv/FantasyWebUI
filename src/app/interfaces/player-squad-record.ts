import { PlayerCommonRecord } from "./player-common-record";

export interface PlayerSquadRecord extends PlayerCommonRecord {
    isRemoved: boolean;
    isNew: boolean;
    isOptimal: boolean;
    expectedFantasyPointsDifference?: number;
    sortOrder: number;
}
  