import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-bugs-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    console.log("REQ");
    console.log(req.body);

    //   var aws = require('aws-sdk')
    // var express = require('express')
    // var multer = require('multer')
    // var multerS3 = require('multer-s3')

    // var app = express()
    // var s3 = new aws.S3({ /* ... */ })

    // var upload = multer({
    //   storage: multerS3({
    //     s3: s3,
    //     bucket: 'some-bucket',
    //     metadata: function (req, file, cb) {
    //       cb(null, {fieldName: file.fieldname});
    //     },
    //     key: function (req, file, cb) {
    //       cb(null, Date.now().toString())
    //     }
    //   })
    // })

    app.post("/upload", upload.array("photos", 3), function (req, res, next) {
      res.send("Successfully uploaded " + req.files.length + " files!");
    });

    const results = {};
    console.log(results);
    res.status_code = 200;
    return results;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = 404;
    return {
      element: "media-bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
