import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import { MapKeysPipe } from './pipes/mapkeys.pipe';
import { NgxUiLoaderModule } from "ngx-ui-loader";
import {MatTooltipModule} from '@angular/material/tooltip';

import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatNativeDateModule} from '@angular/material/core';

@NgModule({
  declarations: [
    AppComponent,
    MapKeysPipe
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
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
