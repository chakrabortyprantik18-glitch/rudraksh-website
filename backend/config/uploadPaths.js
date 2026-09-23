const path = require("path");
const fs = require("fs");

require("dotenv").config();

/*
|--------------------------------------------------------------------------
| UPLOAD STORAGE
|--------------------------------------------------------------------------
| Production (Hostinger):
| Use a directory outside the deployed Node.js build so uploaded files
| survive future deployments.
|
| Local development:
| Continue using UPLOADS_DIR from .env when available, otherwise use
| the normal backend/uploads directory.
|--------------------------------------------------------------------------
*/

const defaultLocalUploadsRoot = path.join(
  __dirname,
  "..",
  "uploads"
);

const productionUploadsRoot =
  "/home/u971217752/rudraksh_uploads";

const isProduction =
  process.env.NODE_ENV === "production";

const UPLOADS_ROOT = path.resolve(
  isProduction
    ? productionUploadsRoot
    : process.env.UPLOADS_DIR || defaultLocalUploadsRoot
);

/*
|--------------------------------------------------------------------------
| UPLOAD DIRECTORIES
|--------------------------------------------------------------------------
*/

const GALLERY_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "gallery"
);

const PROJECTS_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "projects"
);

const MEMBERS_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "members"
);

const EVENTS_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "events"
);

const MEMBERSHIP_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "membership"
);

const CONTENT_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "content"
);

const FORMS_UPLOAD_DIR = path.join(
  UPLOADS_ROOT,
  "forms"
);

/*
|--------------------------------------------------------------------------
| CREATE DIRECTORIES
|--------------------------------------------------------------------------
*/

const uploadDirectories = [
  UPLOADS_ROOT,
  GALLERY_UPLOAD_DIR,
  PROJECTS_UPLOAD_DIR,
  MEMBERS_UPLOAD_DIR,
  EVENTS_UPLOAD_DIR,
  MEMBERSHIP_UPLOAD_DIR,
  CONTENT_UPLOAD_DIR,
  FORMS_UPLOAD_DIR,
];

for (const directory of uploadDirectories) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  UPLOADS_ROOT,
  GALLERY_UPLOAD_DIR,
  PROJECTS_UPLOAD_DIR,
  MEMBERS_UPLOAD_DIR,
  EVENTS_UPLOAD_DIR,
  MEMBERSHIP_UPLOAD_DIR,
  CONTENT_UPLOAD_DIR,
  FORMS_UPLOAD_DIR,
};