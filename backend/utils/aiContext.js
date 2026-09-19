const { pool } = require("../config/db");

async function getAIWebsiteContext() {
  let connection;

  try {
    connection = await pool.getConnection();

    // =========================================================
    // WEBSITE SETTINGS
    // =========================================================

    const [settings] = await connection.query(`
      SELECT
        setting_key,
        setting_value
      FROM site_settings
      ORDER BY id ASC
    `);

    // =========================================================
    // PROJECTS
    // =========================================================

    const [projects] = await connection.query(`
      SELECT
        title,
        short_description,
        description,
        project_date,
        location,
        status
      FROM projects
      WHERE is_published = TRUE
      ORDER BY
        project_date DESC,
        display_order ASC
      LIMIT 50
    `);

    // =========================================================
    // EVENTS
    // =========================================================

    const [events] = await connection.query(`
      SELECT
        title,
        description,
        event_date,
        event_time,
        location,
        status
      FROM events
      WHERE is_published = TRUE
      ORDER BY
        event_date DESC,
        display_order ASC
      LIMIT 50
    `);

    // =========================================================
    // MEMBERS
    // =========================================================

    const [members] = await connection.query(`
      SELECT
        name,
        position,
        bio,
        joined_date
      FROM members
      WHERE is_active = TRUE
      ORDER BY
        display_order ASC,
        name ASC
      LIMIT 100
    `);

    // =========================================================
    // FAQS
    // =========================================================

    const [faqs] = await connection.query(`
      SELECT
        question,
        answer
      FROM faqs
      WHERE is_published = TRUE
      ORDER BY
        display_order ASC,
        id ASC
      LIMIT 100
    `);

    // =========================================================
    // SOCIAL LINKS
    // =========================================================

    const [socialLinks] = await connection.query(`
      SELECT
        platform,
        url
      FROM social_links
      WHERE is_active = TRUE
      ORDER BY
        display_order ASC,
        platform ASC
    `);

    // =========================================================
    // GALLERY
    // =========================================================

    const [gallery] = await connection.query(`
      SELECT
        title,
        description,
        image_url,
        category,
        event_id,
        project_id
      FROM gallery
      WHERE is_published = TRUE
      ORDER BY
        display_order ASC,
        id DESC
      LIMIT 100
    `);

    // =========================================================
    // CONVERT SETTINGS TO OBJECT
    // =========================================================

    const settingsObject = {};

    for (const setting of settings) {
      settingsObject[setting.setting_key] =
        setting.setting_value;
    }

    // =========================================================
    // BUILD PUBLIC AI CONTEXT
    // =========================================================

    const context = {
      organization: {
        name:
          settingsObject.organization_name ||
          "Rudraksh Social & Cultural Organization",

        location:
          settingsObject.location ||
          "Nilambazar, Sribhumi district, Assam, India",

        email:
          settingsObject.email || "",

        phone:
          settingsObject.phone || "",

        whatsapp:
          settingsObject.whatsapp || "",

        google_maps:
          settingsObject.google_maps || "",
      },

      // =======================================================
      // PUBLIC WEBSITE SETTINGS
      // =======================================================

      public_settings: settingsObject,

      // =======================================================
      // PROJECTS
      // =======================================================

      projects: projects.map((project) => ({
        title: project.title,

        short_description:
          project.short_description || "",

        description:
          project.description || "",

        date:
          project.project_date || null,

        location:
          project.location || "",

        status:
          project.status || "",
      })),

      // =======================================================
      // EVENTS
      // =======================================================

      events: events.map((event) => ({
        title: event.title,

        description:
          event.description || "",

        date:
          event.event_date || null,

        time:
          event.event_time || null,

        location:
          event.location || "",

        status:
          event.status || "",
      })),

      // =======================================================
      // MEMBERS
      // =======================================================

      members: members.map((member) => ({
        name: member.name,

        position:
          member.position || "",

        bio:
          member.bio || "",

        joined_date:
          member.joined_date || null,
      })),

      // =======================================================
      // FAQS
      // =======================================================

      faqs: faqs.map((faq) => ({
        question:
          faq.question,

        answer:
          faq.answer,
      })),

      // =======================================================
      // SOCIAL LINKS
      // =======================================================

      social_links: socialLinks.map((social) => ({
        platform:
          social.platform,

        url:
          social.url,
      })),

      // =======================================================
      // GALLERY
      // =======================================================

      gallery: gallery.map((item) => ({
        title:
          item.title || "",

        description:
          item.description || "",

        image_url:
          item.image_url || "",

        category:
          item.category || "",

        event_id:
          item.event_id || null,

        project_id:
          item.project_id || null,
      })),
    };

    return context;
  } catch (error) {
    console.error(
      "AI DATABASE CONTEXT ERROR:",
      error
    );

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  getAIWebsiteContext,
};