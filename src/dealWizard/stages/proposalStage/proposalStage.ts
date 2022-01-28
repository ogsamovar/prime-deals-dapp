import { autoinject } from "aurelia-framework";
import { RouteConfig } from "aurelia-router";
import { IBaseWizardStage } from "../../dealWizardTypes";
import { WizardService, IWizardState } from "../../../services/WizardService";
import { IDealRegistrationData } from "entities/DealRegistrationData";

@autoinject
export class ProposalStage implements IBaseWizardStage {
  public wizardManager: any;
  public wizardState: IWizardState<IDealRegistrationData>;
  public errors: WizardErrors<IProposal> = {};

  constructor(public wizardService: WizardService) {}

  activate(_params: unknown, routeConfig: RouteConfig): void {
    this.wizardManager = routeConfig.settings.wizardManager;
  }

  attached(): void {
    this.wizardState = this.wizardService.getWizardState(this.wizardManager);
    this.wizardService.registerStageValidateFunction(this.wizardManager, this.validate.bind(this));
  }

  validate(): boolean {
    this.errors = {};

    if (!this.wizardState.registrationData.proposal.title) {
      this.errors.title = "Required Input";
    }

    if (!this.wizardState.registrationData.proposal.summary) {
      this.errors.summary = "Required Input";
    } else if (this.wizardState.registrationData.proposal.summary.length < 10) {
      this.errors.summary = "Input is too short";
    }

    if (!this.wizardState.registrationData.proposal.description) {
      this.errors.description = "Required Input";
    } else if (this.wizardState.registrationData.proposal.description.length < 10) {
      this.errors.description = "Input is too short";
    }

    return !Object.keys(this.errors).length;
  }
}
