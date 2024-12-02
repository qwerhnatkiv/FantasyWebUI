import { ListRange } from '@angular/cdk/collections';
import {
  CdkVirtualScrollRepeater,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { Observable, of, ReplaySubject } from 'rxjs';
import { TableColumn } from 'src/app/interfaces/table-column';

export class ColumnScrollDataHandlerService
  implements CdkVirtualScrollRepeater<TableColumn>
{
  private columnsToDisplaySubject = new ReplaySubject<TableColumn[]>(1);
  public readonly columnsToDisplayStream = this.columnsToDisplaySubject.asObservable();
  public readonly dataStream: Observable<readonly TableColumn[]>;

  constructor(
    private allColumns: TableColumn[],
    viewPort: CdkVirtualScrollViewport
  ) {
    this.dataStream = of(this.allColumns);
    viewPort.renderedRangeStream.subscribe((range) => {
      this.columnsToDisplaySubject.next(
        allColumns.slice(range.start, range.end)
      );
    });
    viewPort.attach(this);
  }
  measureRangeSize(
    range: ListRange,
    orientation: 'horizontal' | 'vertical'
  ): number {
    return 0;
  }
}
