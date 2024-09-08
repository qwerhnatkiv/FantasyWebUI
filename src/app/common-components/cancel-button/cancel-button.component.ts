import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'cancel-button',
  templateUrl: './cancel-button.component.html',
  styleUrl: './cancel-button.component.css',
})
export class CancelButtonComponent {
  /**
   * Determines whether button should be hidden or not
   */
  @Input() isHidden!: boolean;

  /**
   * Emits click events to the parent component
   */
  @Output() clickEmitter: EventEmitter<void> = new EventEmitter();

  /**
   * Emits cancel event to the parent component
   */
  emitClickEvent(): void {
    this.clickEmitter.emit();
  }
}
