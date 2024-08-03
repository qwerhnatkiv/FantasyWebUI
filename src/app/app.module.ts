import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MapKeysPipe } from './pipes/mapkeys.pipe';
import { PlayersLabelByCountPipe } from './pipes/players-label-by-count.pipe';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import {
  MatTooltipModule,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
} from '@angular/material/tooltip';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  DateAdapter,
  MatNativeDateModule,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { MY_FORMATS } from './common/custom-date-format';
import { CalendarTableComponent } from './calendar-table/calendar-table.component';
import { PlayersTableComponent } from './players-table/players-table.component';
import { ToiPipe } from './pipes/toi.pipe';
import { MatSortModule } from '@angular/material/sort';
import { PlayersFiltersComponent } from './players-filters/players-filters.component';

import { NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

import { NgxTippyModule } from 'ngx-tippy-wrapper';

import {CdkTableModule} from '@angular/cdk/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import { PlayersSquadComponent } from './players-squad/players-squad.component';
import {MatRadioModule} from '@angular/material/radio';

import {MatCheckboxModule} from '@angular/material/checkbox';
import { CustomDateAdapter } from './common/custom-date-adapter';
import { PositionsMapPipe } from './pipes/positions-map.pipe';
import { ObservablesProxyHandlingService } from 'src/services/observables-proxy-handling';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CellClassPipe } from './pipes/cell-class.pipe';
import { CellTextClassPipe } from './pipes/cell-text-class.pipe';

export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 0,
  touchendHideDelay: 500,
  disableTooltipInteractivity: true,
};

@NgModule({
  declarations: [
    AppComponent,
    MapKeysPipe,
    PlayersLabelByCountPipe,
    PositionsMapPipe,
    ToiPipe,
    CalendarTableComponent,
    PlayersTableComponent,
    PlayersFiltersComponent,
    PlayersSquadComponent,
    CellClassPipe,
    CellTextClassPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatTableModule,
    NgxUiLoaderModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatSortModule,
    MatSelectModule,
    NgFor,
    MatDividerModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    NgxTippyModule,
    CdkTableModule,
    MatPaginatorModule,
    MatRadioModule,
    MatCheckboxModule,
    ScrollingModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
    ObservablesProxyHandlingService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
