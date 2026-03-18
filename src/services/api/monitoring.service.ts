import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonitoringDataDTO, HealthCheckDTO, UpdateLogEntryDTO } from 'src/app/interfaces/monitoring-status';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly baseUrl = 'https://qwerhnatkiv-backend.azurewebsites.net';

  constructor(private http: HttpClient) {}

  /**
   * Get complete monitoring data including health check and update logs
   * @param limit Optional limit for update log entries (default: 50)
   * @returns Observable with monitoring data
   */
  public getMonitoringData(limit: number = 50): Observable<MonitoringDataDTO> {
    return this.http.get<MonitoringDataDTO>(
      `${this.baseUrl}/monitoring/data?limit=${limit}`
    );
  }

  /**
   * Get health check status for all monitored tables
   * @returns Observable with health check data
   */
  public getHealthCheck(): Observable<HealthCheckDTO> {
    return this.http.get<HealthCheckDTO>(
      `${this.baseUrl}/monitoring/health-check`
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
   * Get status for specific table
   * @param tableName Name of the table (e.g., 'f_players_nst')
   * @returns Observable with table status
   */
  public getTableStatus(tableName: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/monitoring/table-status/${tableName}`
    );
  }
}
