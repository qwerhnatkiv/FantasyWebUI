import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GREEN_COLOR, GREEN_COLOR_ACTIVE, WHITE_COLOR, YELLOW_COLOR, YELLOW_COLOR_ACTIVE } from 'src/constants';

const DEFAULT_ICON_RELATIVE_SIZE: number = 91;

@Component({
  selector: 'i-button',
  templateUrl: './i-button.component.html',
  styleUrl: './i-button.component.css'
})
export class IButtonComponent implements OnInit {
  /**
   * Relative path to button's background icon
   */
  @Input() iconPath!: string;

  /**
   * Relative icon size relative to the button itself. Must be in range of 1 to 100 (in percents)
   */
  @Input() iconRelativeSize: number = DEFAULT_ICON_RELATIVE_SIZE;

  /**
   * Determines whether button may have two states (active/inactive), or it's one-state button
   */
  @Input() allowActiveState: boolean = false;

  /**
   * Button tooltip text
   */
  @Input() tooltipText: string | null = null;

  @Input() removeBackgroundColor: boolean = false;

  /**
   * Emits click events to the parent component
   */
  @Output() clickEmitter: EventEmitter<void> = new EventEmitter();

  private _isActive: boolean = false;
  
  public backgroundColor: string = WHITE_COLOR;
  public backgroundColorActive: string = WHITE_COLOR;

  ngOnInit(): void {
    this.backgroundColor = this.removeBackgroundColor ? WHITE_COLOR : YELLOW_COLOR;
    this.backgroundColorActive = this.removeBackgroundColor ? WHITE_COLOR : YELLOW_COLOR_ACTIVE;
  }

  /**
   * Emits events to the parent component
   */
  emitClickEvent(): void {
    this.clickEmitter.emit();

    // If button can have active state, change it background color to "active"
    if (this.allowActiveState && !this.removeBackgroundColor) {
      this._isActive = !this._isActive;
      this._setBackgroundColor();
    }
  }

  private _setBackgroundColor(): void {
    if (this._isActive) {
      this.backgroundColor = GREEN_COLOR;
      this.backgroundColorActive = GREEN_COLOR_ACTIVE;
    }
    else {
      this.backgroundColor = YELLOW_COLOR;
      this.backgroundColorActive = YELLOW_COLOR_ACTIVE;
    }
  }
}
