/* eslint-disable linebreak-style */
import { autoinject } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { Router, RouterConfiguration, NavigationInstruction, Next } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";
import "./styles/styles.scss";
import "./app.scss";
import tippy from "tippy.js";
import { BindingSignaler } from "aurelia-templating-resources";
import { EthereumService } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { BrowserStorageService } from "services/BrowserStorageService";
import { AlertService } from "services/AlertService";
import { ShowButtonsEnum } from "resources/dialogs/alert/alert";
import { STAGE_ROUTE_PARAMETER, WizardType } from "wizards/tokenSwapDealWizard/dealWizardTypes";

export const AppStartDate = new Date("2022-05-03T14:00:00.000Z");

@autoinject
export class App {
  constructor (
    private signaler: BindingSignaler,
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private consoleLogService: ConsoleLogService,
    private alertService: AlertService,
    private storageService: BrowserStorageService) { }

  router: Router;
  onOff = false;
  onOffStack = 0;
  modalMessage: string;
  initializing = true;
  showingMobileMenu = false;
  showingWalletMenu = false;
  intervalId: any;

  errorHandler = (ex: unknown): boolean => {
    this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an unexpected error occurred", ex));
    return false;
  };

  public attached(): void {
    // so all elements with data-tippy-content will automatically have a tooltip
    tippy("[data-tippy-content]");

    window.addEventListener("error", this.errorHandler);

    document.addEventListener("scroll", (_e) => {
      this.handleScrollEvent();
    });

    this.eventAggregator.subscribe("deals.loading", async (onOff: boolean) => {
      this.modalMessage = "Thank you for your patience while we initialize for a few moments...";
      this.handleOnOff(onOff);
    });

    this.eventAggregator.subscribe("deal.creating", async (onOff: boolean) => {
      this.modalMessage = "Thank you for your patience while we initiate the creation of a new deal...";
      this.handleOnOff(onOff);
    });

    this.eventAggregator.subscribe("transaction.sent", async () => {
      this.modalMessage = "Awaiting confirmation...";
      this.handleOnOff(true);
    });

    this.eventAggregator.subscribe("transaction.confirmed", async () => {
      this.handleOnOff(false);
    });

    this.eventAggregator.subscribe("transaction.failed", async () => {
      this.handleOnOff(false);
    });

    this.eventAggregator.subscribe("Network.wrongNetwork", async (info: { provider: any, connectedTo: string, need: string }) => {

      let notChanged = true;
      const connect = await this.alertService.showAlert(
        `You are connecting to ${info.connectedTo ?? "an unknown network"}, but to interact with launches we need you to connect to ${info.need}.  Do you want to switch your connection ${info.need} now?`,
        // eslint-disable-next-line no-bitwise
        ShowButtonsEnum.OK | ShowButtonsEnum.Cancel);

      if (!connect.wasCancelled && !connect.output) {
        if (await this.ethereumService.switchToTargetedNetwork(info.provider)) {
          notChanged = false;
        }
      }

      if (notChanged) {
        this.ethereumService.disconnect({ code: -1, message: "wrong network" });
        this.eventAggregator.publish("handleFailure", `Please connect to ${info.need}`);
      }
    });

    this.intervalId = setInterval(async () => {
      this.signaler.signal("secondPassed");
      const blockDate = this.ethereumService.lastBlock?.blockDate;
      if (blockDate) {
        this.eventAggregator.publish("secondPassed", {blockDate, now: new Date()});
      }
    }, 1000);

    window.addEventListener("resize", () => { this.showingMobileMenu = false; });

    /**
     * undo stuff from base.css now that we don't need it
     */
    document.querySelector("body").classList.remove("loading");

    this.ethereumService.connectToConnectedProvider();
  }

  private handleOnOff(onOff: boolean): void {
    this.onOffStack += onOff ? 1 : -1;
    if (this.onOffStack < 0) {
      this.onOffStack = 0;
      this.consoleLogService.logMessage("underflow in onOffStack", "warn");
    }
    if (this.onOffStack && !this.onOff) {
      this.onOff = true;
    } else if ((this.onOffStack === 0) && this.onOff) {
      this.onOff = false;
    }
  }

  private configureRouter(config: RouterConfiguration, router: Router) {

    config.title = "Prime Deals";
    config.options.pushState = true;
    // const isIpfs = (window as any).IS_IPFS;
    // if (isIpfs) {
    //   this.consoleLogService.handleMessage(`Routing for IPFS: ${window.location.pathname}`);
    // }
    config.options.root = "/"; // window.location.pathname; // to account for IPFS
    /**
     * first set the landing page.
     * it is possible to be connected but have the wrong chain.
     */
    config.map([
      {
        moduleId: PLATFORM.moduleName("./home/home"),
        nav: true,
        name: "home",
        route: ["", "/", "/home"],
        title: "Home",
      },
      {
        moduleId: PLATFORM.moduleName("./contribute/contribute"),
        nav: true,
        name: "contribute",
        route: "/contribute",
        title: "Contribute",
      },
      {
        moduleId: PLATFORM.moduleName("./wizards/tokenSwapDealWizard/wizardManager"),
        route: `/initiate/token-swap/open-proposal/*${STAGE_ROUTE_PARAMETER}`,
        nav: false,
        name: "createOpenProposal",
        title: "Create an Open Proposal",
        settings: {
          wizardType: WizardType.openProposal,
        },
      },
      {
        moduleId: PLATFORM.moduleName("./wizards/tokenSwapDealWizard/wizardManager"),
        route: `/initiate/token-swap/partnered-deal/*${STAGE_ROUTE_PARAMETER}`,
        nav: false,
        name: "createPartneredDeal",
        title: "Create a Partnered Deal",
        settings: {
          wizardType: WizardType.partneredDeal,
        },
      },
      {
        moduleId: PLATFORM.moduleName("./wizards/tokenSwapDealWizard/wizardManager"),
        nav: false,
        name: "makeOfferWizard",
        route: `/make-an-offer/:id/*${STAGE_ROUTE_PARAMETER}`,
        title: "Make an offer",
        settings: {
          wizardType: WizardType.makeAnOffer,
        },
      },
      {
        moduleId: PLATFORM.moduleName("./wizards/tokenSwapDealWizard/wizardManager"),
        nav: false,
        name: "editOpenProposal",
        route: `/open-proposal/:id/edit/*${STAGE_ROUTE_PARAMETER}`,
        title: "Edit an Open Proposal",
        settings: {
          wizardType: WizardType.openProposalEdit,
        },
      },
      {
        moduleId: PLATFORM.moduleName("./wizards/tokenSwapDealWizard/wizardManager"),
        nav: false,
        name: "editPartneredDeal",
        route: `/partnered-deal/:id/edit/*${STAGE_ROUTE_PARAMETER}`,
        title: "Edit a Partnered Deal",
        settings: {
          wizardType: WizardType.partneredDealEdit,
        },
      },
      {
        moduleId: PLATFORM.moduleName("./initiate/tokenSwapTypeSelection/tokenSwapTypeSelection"),
        nav: false,
        name: "tokenSwapTypeSelection",
        route: "/initiate/token-swap",
        title: "Select Token Swap Type",
      },
      {
        moduleId: PLATFORM.moduleName("./initiate/initiate"),
        nav: false,
        name: "initiate",
        route: "/initiate",
        title: "Initiate a Deal",
      },
      {
        moduleId: PLATFORM.moduleName("./deals/deals"),
        nav: false,
        name: "deals",
        route: "/deals",
        title: "Deals",
      },
      {
        moduleId: PLATFORM.moduleName("./documentation/documentation"),
        nav: false,
        name: "documentation",
        route: "/documentation",
        title: "Documentation",
      },
      {
        moduleId: PLATFORM.moduleName("./dealDashboard/dealDashboard"),
        nav: false,
        name: "dealDashboard",
        route: "/deal/:address",
        title: "DEAL Dashboard",
      },
      {
        moduleId: PLATFORM.moduleName("./comingSoon/comingSoon"),
        nav: false,
        name: "comingSoon",
        route: ["comingSoon"],
        title: "Coming Soon!",
      },
      {
        moduleId: PLATFORM.moduleName("./playground/playground"),
        nav: false,
        name: "playground",
        route: ["playground"],
        title: "Playground",
      },
      {
        route: "playground/*componentName", moduleId: PLATFORM.moduleName("./playground/playgroundWelcome/playgroundWelcome"),
      },
      {
        moduleId: PLATFORM.moduleName("./resources/elements/primeDesignSystem/demos/demos"),
        nav: false,
        name: "storybook",
        route: ["storybook"],
        title: "Storybook",
      },
    ]);

    config.fallbackRoute("home");

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    /**
     * obtain and store the scroll position per each page as we leave
     */
    config.addPreActivateStep({
      run(navigationInstruction: NavigationInstruction, next: Next) {
        if (navigationInstruction.previousInstruction) {
          let position = _this.storageService.ssGet(_this.getScrollStateKey(navigationInstruction.previousInstruction.fragment));
          if (!position) {
            position = `${window.scrollX},${window.scrollY}`;
            _this.storageService.ssSet(_this.getScrollStateKey(navigationInstruction.previousInstruction.fragment), position);
          }
        }
        return next();
      },
    });

    /**
     * restore the scroll position per each page as we arrive
     */
    config.addPostRenderStep({
      run(navigationInstruction: NavigationInstruction, next: Next) {
        let position = _this.storageService.ssGet(_this.getScrollStateKey(navigationInstruction.fragment));
        if (!position) {
          position = "0,0";
        }
        const scrollArgs = position.split(",");
        setTimeout(() => window.scrollTo(Number(scrollArgs[0]), Number(scrollArgs[1])), 100);
        return next();
      },
    });

    this.router = router;
  }
  /**
   * store the scroll position per each page
   */
  handleScrollEvent(): void {
    this.storageService.ssSet(this.getScrollStateKey(this.router.currentInstruction.fragment),
      `${window.scrollX},${window.scrollY}`);
  }

  getScrollStateKey(fragment: string): string {
    switch (fragment) {
      case "":
      case "/":
      case "/home":
        return "scroll-/home";
      default:
        return `scroll-${fragment}`;
    }
  }

  onNavigate(): void {
    this.showingMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showingMobileMenu = !this.showingMobileMenu;
  }

  navigate(href: string): void {
    this.onNavigate();
    this.router.navigate(href);
  }

  handleShowWalletMenu(): void {
    this.showingWalletMenu = true;
  }
}
