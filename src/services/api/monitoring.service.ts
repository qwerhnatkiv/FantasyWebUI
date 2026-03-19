import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  MonitoringDataDTO,
  HealthCheckDTO,
  UpdateLogEntryDTO,
  ExecuteDmUpdateResponseDTO,
  TableStatusDTO,
} from 'src/app/interfaces/monitoring-status';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly baseUrl = 'https://qwerhnatkiv-backend.azurewebsites.net';

  constructor(private http: HttpClient) {}

  /**
   * Get complete monitoring data including health check and update logs
   * @returns Observable with monitoring data
   */
  public getMonitoringData(): Observable<MonitoringDataDTO> {
    return this.http
      .get<MonitoringDataDTO>(`${this.baseUrl}/monitoring/data`)
      .pipe(map((data) => this.normalizeMonitoringData(data)));
  }

  /**
   * Get health check status for all monitored tables
   * Treat 503 critical responses as valid business payloads
   * @returns Observable with health check data
   */
  public getHealthCheck(): Observable<HealthCheckDTO> {
    return this.http
      .get<HealthCheckDTO>(`${this.baseUrl}/monitoring/health-check`, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body as HealthCheckDTO),
        map((healthCheck) => this.normalizeHealthCheck(healthCheck)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 503 && error.error) {
            return of(this.normalizeHealthCheck(error.error as HealthCheckDTO));
          }

          return throwError(() => error);
        })
      );
  }

  /**
   * Get recent update logs
   * @param limit Number of entries to retrieve (default: 50)
   * @param offset Starting offset for pagination (default: 0)
   * @returns Observable with array of update log entries
   */
  public getUpdateLogs(limit: number = 50, offset: number = 0): Observable<UpdateLogEntryDTO[]> {
    return this.http.get<UpdateLogEntryDTO[]>(
      `${this.baseUrl}/monitoring/update-logs?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Trigger manual DM tables update flow
   */
  public executeDmUpdate(): Observable<ExecuteDmUpdateResponseDTO> {
    return this.http.post<ExecuteDmUpdateResponseDTO>(
      `${this.baseUrl}/monitoring/execute-dm-update`,
      {}
    );
  }

  /**
   * Get status for specific table
   * @param tableName Name of the table (e.g., 'f_players_nst')
   * @returns Observable with table status
   */
  public getTableStatus(tableName: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/monitoring/table-status/${tableName}`
    );
  }

  private normalizeMonitoringData(data: MonitoringDataDTO): MonitoringDataDTO {
    return {
      ...data,
      healthCheck: this.normalizeHealthCheck(data.healthCheck),
    };
  }

  private normalizeHealthCheck(healthCheck: HealthCheckDTO): HealthCheckDTO {
    return {
      ...healthCheck,
      tableStatuses: (healthCheck.tableStatuses || []).map((status: TableStatusDTO) => ({
        ...status,
        lastUpdateTime: status.lastUpdateTime || null,
        hoursSinceLastUpdate:
          status.hoursSinceLastUpdate !== undefined ? status.hoursSinceLastUpdate : null,
      })),
      importantTablesDuplicateCounts: healthCheck.importantTablesDuplicateCounts || [],
      totalDuplicateRows: healthCheck.totalDuplicateRows || 0,
    };
  }
}
