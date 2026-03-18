import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MonitoringService } from 'src/services/api/monitoring.service';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { MonitoringDataDTO, HealthCheckDTO, UpdateLogEntryDTO, TableStatusDTO } from '../interfaces/monitoring-status';
import { of } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';

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
  protected errorMessage?: string;

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
    private ngxUiLoaderService: NgxUiLoaderService,
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
      .getMonitoringData(this.LOG_LIMIT)
      .pipe(
        catchError((error) => {
          console.error('Failed to load monitoring data:', error);
          this.errorMessage =
            'Failed to load monitoring data. Please try again later.';
          return of(undefined);
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
        switchMap(() => this.monitoringService.getMonitoringData(this.LOG_LIMIT)),
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
  protected formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h`;
    } else {
      return `${Math.round(minutes / 1440)}d`;
    }
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
  protected getTimeSinceUpdate(date: Date | string | null): number {
    if (!date) {
      return 0;
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    return Math.floor((Date.now() - d.getTime()) / 60000);
  }

  /**
   * Calculate operation duration in seconds
   */
  protected getOperationDuration(startTime: Date | string, endTime: Date | string): number {
    const start = typeof startTime === 'string' ? new Date(startTime).getTime() : new Date(startTime).getTime();
    const end = typeof endTime === 'string' ? new Date(endTime).getTime() : new Date(endTime).getTime();
    return Math.round((end - start) / 1000);
  }
}
