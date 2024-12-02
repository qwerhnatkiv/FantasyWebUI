import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IButtonComponent } from './i-button.component';

describe('IButtonComponent', () => {
  let component: IButtonComponent;
  let fixture: ComponentFixture<IButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
