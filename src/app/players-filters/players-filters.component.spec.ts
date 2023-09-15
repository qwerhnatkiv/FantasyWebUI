import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayersFiltersComponent } from './players-filters.component';

describe('PlayersFiltersComponent', () => {
  let component: PlayersFiltersComponent;
  let fixture: ComponentFixture<PlayersFiltersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayersFiltersComponent]
    });
    fixture = TestBed.createComponent(PlayersFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
