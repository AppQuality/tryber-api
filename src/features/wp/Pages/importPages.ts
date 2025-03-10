import { tryber } from "@src/features/database";
import { ManualPageImporter } from "./ManualPageImporter";
import { PreviewPageImporter } from "./PreviewPageImporter";

const importPages = async (from: number, to: number) => {
  const campaign = await tryber.tables.WpAppqEvdCampaign.do()
    .select("page_manual_id", "page_preview_id")
    .where("id", from);

  if (!campaign.length) return;

  const { page_manual_id, page_preview_id } = campaign[0];

  const manual = new ManualPageImporter({
    campaignId: from,
    pageId: page_manual_id,
  });
  const newManId = await manual.createPage();
  await tryber.tables.WpAppqEvdCampaign.do()
    .update({
      page_manual_id: newManId,
    })
    .where("id", to);
  manual.updateTitleWithCampaignId(to);
  manual.updateMetaWithCampaignId(to);

  const preview = new PreviewPageImporter({
    campaignId: from,
    pageId: page_preview_id,
  });
  const newPrevId = await preview.createPage();
  await tryber.tables.WpAppqEvdCampaign.do()
    .update({
      page_preview_id: newPrevId,
    })
    .where("id", to);
  preview.updateTitleWithCampaignId(to);
  preview.updateMetaWithCampaignId(to);
};

export { importPages };
