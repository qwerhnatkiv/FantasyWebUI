export interface PositionsAvailableToPick {
  goaliesAvailable: number;
  defendersAvailable: number;
  forwardsAvailable: number;

  selectedPlayerIds: Array<number>;
}
