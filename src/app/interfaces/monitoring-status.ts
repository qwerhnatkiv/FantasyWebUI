/**
 * Status of a single database table
 */
export interface TableStatusDTO {
  /** Table name (e.g., 'f_players_nst', 'f_games', etc.) */
  tableName: string;

  /** Timestamp of the last successful data update */
  lastUpdateTime: Date;

  /** Number of records in the table */
  recordCount: number;

  /** Total rows updated in the last operation */
  rowsAffected: number;

  /** Health status of the table */
  status: 'healthy' | 'warning' | 'error';

  /** Optional status message */
  message?: string;
}

/**
 * Overall system health status
 */
export interface HealthCheckDTO {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'critical';

  /** Timestamp of the healthcheck */
  timestamp: Date;

  /** Message describing the overall status */
  message: string;

  /** List of all monitored tables and their statuses */
  tableStatuses: TableStatusDTO[];

  /** Average time since last update across all tables (in minutes) */
  averageTimeSinceLastUpdateMinutes: number;

  /** Number of tables with errors */
  tablesInError: number;
}

/**
 * Update log entry
 */
export interface UpdateLogEntryDTO {
  /** Unique ID for the log entry */
  id: string;

  /** Name of the operation/data source */
  operationName: string;

  /** Table(s) affected by this operation */
  tableNames: string[];

  /** When the operation started */
  startTime: Date;

  /** When the operation finished */
  endTime: Date;

  /** Status of the operation */
  status: 'success' | 'partial' | 'failed';

  /** Number of records inserted */
  recordsInserted: number;

  /** Number of records updated */
  recordsUpdated: number;

  /** Number of records deleted */
  recordsDeleted: number;

  /** Any error message if failed */
  errorMessage?: string;

  /** Additional details/notes */
  details?: string;
}

/**
 * Complete monitoring data response
 */
export interface MonitoringDataDTO {
  /** Health check information */
  healthCheck: HealthCheckDTO;

  /** Recent update log entries */
  updateLog: UpdateLogEntryDTO[];
}
