import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const user = req.user;
    let uploadedFiles: StoplightOperations["post-media"]["responses"]["200"]["content"]["application/json"] =
      [];
    if (req.files.media && user) {
      const files = req.files.media;

      //console.log(req.files.media);

      if (Array.isArray(files)) {
        for (const media of files) {
          const today = new Date();
          const date =
            today.getFullYear() +
            "_" +
            (today.getMonth() + 1) +
            "_" +
            today.getDate();

          const extension = media.name.split(".").pop();
          if (extension) media.name = media.name.replace(extension, "");
          const name = media.name + "_" + date + "." + extension;
          let uploadedFile = await upload({
            bucket: `tryber.assets.static/media/T${user.testerId}`,
            key: name,
            file: media,
          });
          uploadedFiles.push(uploadedFile.toString());
          console.log(uploadedFiles);
        }
        res.status_code = 200;
        return uploadedFiles;
      }
    }
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      element: "media-bugs",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }
};
