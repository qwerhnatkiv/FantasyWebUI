import { Pipe, PipeTransform } from '@angular/core';
import { DEFAULT_POSITIONS, DEFAULT_POSITIONS_MAP } from 'src/constants';

@Pipe({
  name: 'positionsMap',
})
export class PositionsMapPipe implements PipeTransform {
  transform(data: string): string {
    return data;
    
    if (!DEFAULT_POSITIONS_MAP.has(data)) {
        return '';
    }

    return DEFAULT_POSITIONS_MAP.get(data)!;
  }
}
