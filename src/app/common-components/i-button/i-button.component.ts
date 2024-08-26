import { Component, EventEmitter, Input, Output } from '@angular/core';
import { YELLOW_COLOR, YELLOW_COLOR_ACTIVE } from 'src/constants';

const DEFAULT_ICON_RELATIVE_SIZE: number = 91;

@Component({
  selector: 'i-button',
  templateUrl: './i-button.component.html',
  styleUrl: './i-button.component.css'
})
export class IButtonComponent {
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

  /**
   * Emits click events to the parent component
   */
  @Output() clickEmitter: EventEmitter<void> = new EventEmitter();

  private _isActive: boolean = false;
  
  public readonly YELLOW_COLOR_ACTIVE: string = YELLOW_COLOR_ACTIVE;
  
  public backgroundColor: string = YELLOW_COLOR;

  /**
   * Emits events to the parent component
   */
  emitClickEvent(): void {
    this.clickEmitter.emit();

    // If button can have active state, change it background color to "active"
    if (this.allowActiveState) {
      this._isActive = !this._isActive;
      this._setBackgroundColor();
    }
  }

  private _setBackgroundColor(): void {
    if (this._isActive) {
      this.backgroundColor = YELLOW_COLOR_ACTIVE;
    }
    else {
      this.backgroundColor = YELLOW_COLOR;
    }
  }
}
