import { Overlay, BlockScrollStrategy } from '@angular/cdk/overlay';

export function selectScrollStrategyFactory(overlay: Overlay): () => BlockScrollStrategy {
  return () => overlay.scrollStrategies.block();
}