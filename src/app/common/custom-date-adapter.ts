import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { Moment } from "moment";

export class CustomDateAdapter extends MomentDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }
}
