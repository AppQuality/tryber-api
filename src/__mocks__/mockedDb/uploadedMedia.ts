import Table from "./table";

type UploadedMediaParams = {
  id?: number;
  url?: string;
  creation_date?: string;
};
const defaultItem: UploadedMediaParams = {
  id: 1,
  url: "www.exaple.com/media1.jpg",
  creation_date: "2020-01-01 00:00:00",
};
class UploadedMedia extends Table<UploadedMediaParams> {
  protected name = "wp_appq_uploaded_media";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "url VARCHAR(255) NOT NULL",
    "creation_date DATETIME NOT NULL",
  ];
  constructor() {
    super(defaultItem);
  }
}
const uploadedMedia = new UploadedMedia();
export default uploadedMedia;
export type { UploadedMediaParams };
