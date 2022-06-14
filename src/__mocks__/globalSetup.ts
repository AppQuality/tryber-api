import { table as levelDefTable } from "@src/__mocks__/mockedDb/levelsDefinition";
import sqlite3 from "@src/features/sqlite";

import { table as attributionsTable } from "./mockedDb/attributions";
import { table as bugTable } from "./mockedDb/bug";
import { table as bugStatus } from "./mockedDb/bugStatus";
import BugTypes from "./mockedDb/bugTypes";
import Campaigns from "./mockedDb/campaign";
import { table as certificationListTable } from "./mockedDb/certificationList";
import Candidature from "./mockedDb/cp_has_candidates";
import CustomBugTypes from "./mockedDb/customBugTypes";
import CustomReplicabilities from "./mockedDb/customReplicabilities";
import CustomSeverities from "./mockedDb/customSeverities";
import { table as cufTable } from "./mockedDb/customUserFields";
import { table as cufDataTable } from "./mockedDb/customUserFieldsData";
import { table as cufExtraTable } from "./mockedDb/customUserFieldsExtra";
import deviceOs from "./mockedDb/deviceOs";
import DevicePlatform from "./mockedDb/devicePlatform";
import { table as educationListTable } from "./mockedDb/educationList";
import { table as employmentListTable } from "./mockedDb/employmentList";
import { table as expTable } from "./mockedDb/experience";
import { table as fiscalProfileTable } from "./mockedDb/fiscalProfile";
import { table as languageListTable } from "./mockedDb/languageList";
import { table as levelTable } from "./mockedDb/levels";
import { table as levelRevTable } from "./mockedDb/levelsRevisions";
import { table as paymentRequestTable } from "./mockedDb/paymentRequest";
import { table as popupTable } from "./mockedDb/popups";
import { table as testerTable } from "./mockedDb/profile";
import { table as receiptTable } from "./mockedDb/receipt";
import Replicabilities from "./mockedDb/replicabilities";
import Severities from "./mockedDb/severities";
import { table as testerCertificationTable } from "./mockedDb/testerCertification";
import TesterDevice from "./mockedDb/testerDevice";
import { table as testerLanguageTable } from "./mockedDb/testerLanguage";
import UseCases from "./mockedDb/usecases";
import { table as deletionReasonTable } from "./mockedDb/userDeletionReason";
import { table as workTypeTable } from "./mockedDb/workType";
import WpOptions from "./mockedDb/wp_options";
import CampaignAdditionals from "./mockedDb/campaignAdditionals";
import CampaignMeta from "./mockedDb/campaignMeta";
import UseCaseGroups from "./mockedDb/usecasesGroups";
import { table as wpUserMetaTable } from "./mockedDb/wp_usermeta";
import { table as wpUsersTable } from "./mockedDb/wp_users";

require("ts-node").register({
  transpileOnly: true,
});
require("tsconfig-paths").register();
export {};
beforeAll(async () => {
  await levelRevTable.create();
  await receiptTable.create();
  await workTypeTable.create();
  await popupTable.create();
  await DevicePlatform.mock();
  await deviceOs.mock();
  await wpUserMetaTable.create();
  await deletionReasonTable.create();
  await fiscalProfileTable.create();
  await expTable.create();
  await Campaigns.mock();
  await Candidature.mock();
  await testerTable.create();
  await wpUsersTable.create();
  await levelTable.create();
  await levelDefTable.create();
  await cufDataTable.create();
  await TesterDevice.mock();
  await bugTable.create();
  await certificationListTable.create();
  await testerCertificationTable.create();
  await languageListTable.create();
  await employmentListTable.create();
  await educationListTable.create();
  await testerLanguageTable.create();
  await cufTable.create();
  await cufExtraTable.create();
  await WpOptions.mock();
  await Severities.mock();
  await BugTypes.mock();
  await CustomBugTypes.mock();
  await bugStatus.create();
  await cpSeverity.create();
  await replicabilitiesTable.create();
  await cpReplicabilitiesTable.create();

  await paymentRequestTable.create();
  await sqlite3.run(`
  CREATE TRIGGER "on_update__update_date"
    BEFORE UPDATE ON "wp_appq_payment_request" FOR EACH ROW 
    BEGIN
    UPDATE wp_appq_payment_request set update_date = CURRENT_TIMESTAMP where id = NEW.id;
    END`);

  await attributionsTable.create();
  await CustomSeverities.mock();
  await Replicabilities.mock();
  await CustomReplicabilities.mock();
  await UseCases.mock();
  await CampaignAdditionals.mock();
  await CampaignMeta.mock();
  await UseCaseGroups.mock();
});
