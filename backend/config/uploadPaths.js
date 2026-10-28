
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const isNetlify = Boolean(process.env.NETLIFY);

const defaultLocalUploadsRoot = path.join(
  __dirname,
  "..",
  "uploads"
);

// Netlify's function filesystem is temporary.
// Use /tmp only as a temporary crash-prevention measure.
const UPLOADS_ROOT = path.resolve(
  isNetlify
    ? path.join("/tmp", "rudraksh-uploads")
    : process.env.UPLOADS_DIR ||
        (process.env.NODE_ENV === "production"
          ? "/home/u971217752/rudraksh_uploads"
          : defaultLocalUploadsRoot)
);

const GALLERY_UPLOAD_DIR = path.join(UPLOADS_ROOT, "gallery");
const PROJECTS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "projects");
const MEMBERS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "members");
const EVENTS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "events");
const MEMBERSHIP_UPLOAD_DIR = path.join(UPLOADS_ROOT, "membership");
const CONTENT_UPLOAD_DIR = path.join(UPLOADS_ROOT, "content");
const FORMS_UPLOAD_DIR = path.join(UPLOADS_ROOT, "forms");

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
  fs.mkdirSync(directory, { recursive: true });
}

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
