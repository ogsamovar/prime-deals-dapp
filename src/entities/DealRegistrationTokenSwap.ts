export interface IProposal {
  title: string,
  summary: string,
  description: string;
}

export enum Platforms {
  "Independent",
  "DAOstack",
  "Moloch",
  "OpenLaw",
  "Aragon",
  "Colony",
  "Compound Governance",
  "Snapshot",
  "Gnosis Safe / Snapshot",
  "Substrate",
}

export interface IToken {
  name: string,
  symbol: string,
  balance: string,
  address: string,
}

export interface ISocialMedia {
  name: string,
  url: string,
}
export interface IDAO {
  id: string,
  name: string,
  tokens: Array<IToken>
  social_medias: Array<ISocialMedia>
  members: Array<string>,
  logo_url: string,
  platform?: Platforms,
}

export interface IProposalLead {
  address: string,
  email?: string;
  // dao?: IDAO /* Deprecated: Proposal lead does not need to be part of the a DAO */
}

export interface IClause {
  id: string,
  text: string,
}

export interface ITerms {
  clauses: Array<IClause>,
  // period: number, /* Deprecated: Is provided as executionPeriodInDays */
  // representatives: string, /* Deprecated: Is provided in IDAO information as members */
  coreTeamChatURL: string,
  previousDiscussionURL: string,
}

export interface IDealRegistrationTokenSwap {
  version: string;
  proposal: IProposal;
  primaryDAO: IDAO;
  partnerDAO: IDAO;
  proposalLead: IProposalLead; // this contains to address
  terms: ITerms;
  keepAdminRights: boolean;
  offersPrivate: boolean;
  isPrivate: boolean;
  createdAt: Date | null;
  modifiedAt: Date | null;
  createdByAddress: string | null;
  executionPeriodInDays: number;
  dealType: "token-swap"/* | "joint-venture"*/;
}

export class DealRegistrationTokenSwap implements IDealRegistrationTokenSwap {
  public version: string;
  public proposal: IProposal;
  public primaryDAO: IDAO;
  public partnerDAO: IDAO;
  public proposalLead: IProposalLead; // this maps to address
  public terms: ITerms;
  public keepAdminRights: boolean;
  public offersPrivate: boolean;
  public isPrivate: boolean;
  public createdAt: Date | null;
  public modifiedAt: Date | null;
  public createdByAddress: string | null;
  public executionPeriodInDays: number;
  public dealType: "token-swap"/* | "joint-venture" */;

  constructor() {
    this.clearState();
  }

  clearState(): void {
    this.version = "0.0.1";
    this.proposal = {
      title: "",
      summary: "",
      description: "",
    };
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.primaryDAO = {
      name: "",
      tokens: [{
        name: "",
        symbol: "",
        balance: "",
        address: "",
      }],
      social_medias: [{name: undefined, url: undefined}],
      logo_url: null,
    } as IDAO;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    this.partnerDAO = {
      name: "",
      tokens: [{
        name: "",
        symbol: "",
        balance: "",
        address: "",
      }],
      social_medias: [{name: undefined, url: undefined}],
      logo_url: null,
    } as IDAO;
    this.proposalLead = {
      address: "",
      email: "",
    };
    this.keepAdminRights = true;
    this.offersPrivate = false;
    this.isPrivate = false;
    this.createdAt = null;
    this.modifiedAt = null;
    this.createdByAddress = null;
  }
}
