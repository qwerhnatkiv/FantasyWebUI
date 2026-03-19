import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MonitoringService } from 'src/services/api/monitoring.service';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, switchMap, catchError, map } from 'rxjs/operators';
import {
  MonitoringDataDTO,
  HealthCheckDTO,
  UpdateLogEntryDTO,
  TableStatusDTO,
  ExecuteDmUpdateResponseDTO,
} from '../interfaces/monitoring-status';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-monitoring',
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringComponent implements OnInit, OnDestroy {
  protected monitoringData?: MonitoringDataDTO;
  protected healthCheck?: HealthCheckDTO;
  protected updateLogs: UpdateLogEntryDTO[] = [];
  protected isLoading = false;
  protected isExecutingDmUpdate = false;
  protected errorMessage?: string;
  protected dmUpdateResult?: ExecuteDmUpdateResponseDTO;

  private destroy$ = new Subject<void>();
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds
  private readonly LOG_LIMIT = 20;

  displayedColumns: string[] = [
    'operationName',
    'tableNames',
    'status',
    'recordsInserted',
    'recordsUpdated',
    'recordsDeleted',
    'startTime',
    'endTime',
  ];

  statusColorMap: { [key: string]: string } = {
    healthy: '#4caf50',
    degraded: '#ff9800',
    critical: '#f44336',
    success: '#4caf50',
    partial: '#ff9800',
    failed: '#f44336',
    warning: '#ff9800',
    error: '#f44336',
  };

  constructor(
    private monitoringService: MonitoringService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMonitoringData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  /**
   * Load monitoring data from backend
   */
  protected loadMonitoringData(): void {
    this.isLoading = true;
    this.errorMessage = undefined;

    this.monitoringService
      .getMonitoringData()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Failed to load monitoring data:', error);
          return this.monitoringService.getHealthCheck().pipe(
            map((healthCheck) => ({ healthCheck, updateLog: [] } as MonitoringDataDTO)),
            catchError((healthError) => {
              console.error('Failed to load health check fallback:', healthError);
              this.errorMessage =
                'Failed to load monitoring data. Please try again later.';
              return of(undefined);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (data) {
          this.monitoringData = data;
          this.healthCheck = data.healthCheck;
          this.updateLogs = data.updateLog;
        }
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * Start auto-refresh of monitoring data
   */
  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.monitoringService.getMonitoringData()),
        catchError((error) => {
          console.error('Auto-refresh failed:', error);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (data) {
          this.monitoringData = data;
          this.healthCheck = data.healthCheck;
          this.updateLogs = data.updateLog;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Manually refresh monitoring data
   */
  protected refreshData(): void {
    this.loadMonitoringData();
  }

  protected executeDmUpdate(): void {
    if (this.isExecutingDmUpdate) {
      return;
    }

    this.isExecutingDmUpdate = true;
    this.errorMessage = undefined;

    this.monitoringService
      .executeDmUpdate()
      .pipe(
        catchError((error) => {
          console.error('DM update execution failed:', error);
          this.errorMessage = 'Manual DM update failed. Please try again.';
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (result) {
          this.dmUpdateResult = result;
          this.loadMonitoringData();
        }

        this.isExecutingDmUpdate = false;
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * Get status color for display
   */
  protected getStatusColor(status: string): string {
    return this.statusColorMap[status] || '#999';
  }

  /**
   * Get CSS class for status badge
   */
  protected getStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * Format duration in minutes to readable string
   */
  protected formatHoursDuration(hours: number | null): string {
    if (hours === null || hours === undefined) {
      return 'N/A';
    }

    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }

    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }

    return `${Math.round(hours / 24)}d`;
  }

  /**
   * Format date for display
   */
  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  /**
   * Get time since update in minutes
   */
  protected getHoursSinceUpdate(tableStatus: TableStatusDTO): number | null {
    if (tableStatus.hoursSinceLastUpdate !== null && tableStatus.hoursSinceLastUpdate !== undefined) {
      return tableStatus.hoursSinceLastUpdate;
    }

    if (!tableStatus.lastUpdateTime) {
      return null;
    }

    const d = typeof tableStatus.lastUpdateTime === 'string'
      ? new Date(tableStatus.lastUpdateTime)
      : tableStatus.lastUpdateTime;

    return (Date.now() - d.getTime()) / 3600000;
  }

  /**
   * Calculate operation duration in seconds
   */
  protected getOperationDuration(startTime: Date | string, endTime: Date | string | null): number | null {
    if (!startTime || !endTime) {
      return null;
    }

    const start = typeof startTime === 'string' ? new Date(startTime).getTime() : new Date(startTime).getTime();
    const end = typeof endTime === 'string' ? new Date(endTime).getTime() : new Date(endTime).getTime();
    return Math.round((end - start) / 1000);
  }

  protected isBootstrapWarning(): boolean {
    if (!this.healthCheck) {
      return false;
    }

    return (
      this.healthCheck.status === 'degraded' &&
      this.healthCheck.message.includes('Waiting for first scheduled update window')
    );
  }

  protected hasDuplicateRows(): boolean {
    return (this.healthCheck?.totalDuplicateRows || 0) > 0;
  }
}
