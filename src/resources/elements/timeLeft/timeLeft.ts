import { computedFrom, autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { DateService } from "services/DateService";
import { DealStatus } from "entities/IDealTypes";
import "./timeLeft.scss";
import tippy from "tippy.js";

@autoinject
export class TimeLeft {

  @bindable deal: any;
  @bindable.booleanAttr hideIcons: boolean;
  @bindable.booleanAttr largest: boolean;
  @bindable.booleanAttr contained: boolean;

  timeLeft: HTMLElement;
  tippyInstance: any;
  status: string;

  attached(): void {
    const reversedEnum = {};
    Object.keys(DealStatus).forEach(key => {
      reversedEnum[DealStatus[key]] = key;
    });
    this.status = reversedEnum[this.deal.status];
  }

  constructor(
    private dateService: DateService,
  ) {}

  @computedFrom("deal.startsInMilliseconds", "deal.hasNotStarted")
  get proximity(): number {
    const soon = 86400000;
    const comingUp = soon * 5;
    if (this.deal?.hasNotStarted) {
      if (!this.tippyInstance) {
        this.tippyInstance = tippy(this.timeLeft,
          {
            content: this.dateService.toString(this.deal.startTime, "ddd MMM do - kk:mm z"),
          });
      }
      if (this.deal.startsInMilliseconds > comingUp) {
        return 3; // faroff
      } else if (this.deal.startsInMilliseconds <= soon) {
        return 1; // soon
      } else {
        return 2; // comingUp
      }
    }
  }
}
