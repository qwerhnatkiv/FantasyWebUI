export interface PlayerLineFormatted {
  playerLinematesSimplified: string;
  playerLinematesTooltip: string;
  isPlayingInUpsideLine: boolean;
  // Undefined while the backend that sends it is not deployed
  isFromLineup?: boolean;
}
