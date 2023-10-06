import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayersSquadComponent } from './players-squad.component';

describe('PlayersSquadComponent', () => {
  let component: PlayersSquadComponent;
  let fixture: ComponentFixture<PlayersSquadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayersSquadComponent]
    });
    fixture = TestBed.createComponent(PlayersSquadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
