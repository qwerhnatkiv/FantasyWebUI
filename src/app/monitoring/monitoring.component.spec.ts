import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoringComponent } from './monitoring.component';
import { MonitoringService } from 'src/services/api/monitoring.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { of, throwError } from 'rxjs';
import { MonitoringDataDTO } from '../interfaces/monitoring-status';

describe('MonitoringComponent', () => {
  let component: MonitoringComponent;
  let fixture: ComponentFixture<MonitoringComponent>;
  let monitoringService: jasmine.SpyObj<MonitoringService>;
  let ngxUiLoaderService: jasmine.SpyObj<NgxUiLoaderService>;

  const mockMonitoringData: MonitoringDataDTO = {
    healthCheck: {
      status: 'healthy',
      timestamp: new Date(),
      message: 'All systems operational',
      tableStatuses: [
        {
          tableName: 'f_players_nst',
          lastUpdateTime: new Date(),
          hoursSinceLastUpdate: 0.5,
          recordCount: 1000,
          rowsAffected: 50,
          status: 'healthy',
        },
      ],
      averageTimeSinceLastUpdateHours: 0.5,
      tablesInError: 0,
      importantTablesDuplicateCounts: [],
      totalDuplicateRows: 0,
    },
    updateLog: [],
  };

  beforeEach(async () => {
    const monitoringSpy = jasmine.createSpyObj('MonitoringService', [
      'getMonitoringData',
      'getHealthCheck',
      'getUpdateLogs',
      'getTableStatus',
      'executeDmUpdate',
    ]);
    const uiLoaderSpy = jasmine.createSpyObj('NgxUiLoaderService', [
      'start',
      'stop',
    ]);

    await TestBed.configureTestingModule({
      declarations: [MonitoringComponent],
      providers: [
        { provide: MonitoringService, useValue: monitoringSpy },
        { provide: NgxUiLoaderService, useValue: uiLoaderSpy },
      ],
    }).compileComponents();

    monitoringService = TestBed.inject(MonitoringService) as jasmine.SpyObj<MonitoringService>;
    ngxUiLoaderService = TestBed.inject(NgxUiLoaderService) as jasmine.SpyObj<NgxUiLoaderService>;

    monitoringService.getMonitoringData.and.returnValue(of(mockMonitoringData));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load monitoring data on init', () => {
    expect(monitoringService.getMonitoringData).toHaveBeenCalled();
  });

  it('should handle error when loading data fails', () => {
    monitoringService.getMonitoringData.and.returnValue(
      throwError(() => new Error('API Error'))
    );
    component.ngOnInit();
    expect(component['errorMessage']).toBeDefined();
  });
});
