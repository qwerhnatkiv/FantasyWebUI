export interface TableColumn {
  columnDef: Date | undefined;
  header: string;
  isWeekColumn: boolean;
  isOldDate: boolean;
  week: number;
}
