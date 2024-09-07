import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-simple-select',
  templateUrl: './simple-select.component.html',
  styleUrl: './simple-select.component.css',
})
export class SimpleSelectComponent {
  @Input() options!: string[];
}
