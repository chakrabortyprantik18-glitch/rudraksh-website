
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Save,
  Eye,
  Globe,
  Image,
} from "lucide-react";
import { saveRegistrationForm } from "../api/forms";

const themes = [
  {
    id: "ivory",
    name: "Royal Ivory",
    color: "#E8D9B5",
    background: "#FAF7F0",
  },
  {
    id: "maroon",
    name: "Royal Maroon",
    color: "#762C3B",
    background: "#211419",
  },
  {
    id: "emerald",
    name: "Emerald",
    color: "#167B61",
    background: "#F1F8F4",
  },
  {
    id: "sunset",
    name: "Festival Sunset",
    color: "#F07842",
    background: "#FFF4EC",
  },
];

function CreateForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    eventTitle: "",
    title: "",
    description: "",
    fee: 200,
    free: false,
    deadline: "",
    instructions: "",
    theme: "ivory",
    categories: [],
  });

  const [logo, setLogo] = useState(null);
  const [poster, setPoster] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFormId, setSavedFormId] = useState(null);

  function updateForm(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function addCategory() {
    setForm((previous) => ({
      ...previous,
      categories: [
        ...previous.categories,
        {
          id: crypto.randomUUID(),
          name: "",
          options: [],
        },
      ],
    }));
  }

  function updateCategory(id, value) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === id
          ? { ...category, name: value }
          : category
      ),
    }));
  }

  function removeCategory(id) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.filter(
        (category) => category.id !== id
      ),
    }));
  }

  function addOption(categoryId) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: [
                ...category.options,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  groups: [],
                },
              ],
            }
          : category
      ),
    }));
  }

  function updateOption(categoryId, optionId, value) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: category.options.map((option) =>
                option.id === optionId
                  ? { ...option, name: value }
                  : option
              ),
            }
          : category
      ),
    }));
  }

  function removeOption(categoryId, optionId) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: category.options.filter(
                (option) => option.id !== optionId
              ),
            }
          : category
      ),
    }));
  }

  function addGroup(categoryId, optionId) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: category.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      groups: [
                        ...option.groups,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          eligibility: "",
                        },
                      ],
                    }
                  : option
              ),
            }
          : category
      ),
    }));
  }

  function updateGroup(
    categoryId,
    optionId,
    groupId,
    key,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: category.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      groups: option.groups.map((group) =>
                        group.id === groupId
                          ? { ...group, [key]: value }
                          : group
                      ),
                    }
                  : option
              ),
            }
          : category
      ),
    }));
  }

  function removeGroup(categoryId, optionId, groupId) {
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              options: category.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      groups: option.groups.filter(
                        (group) => group.id !== groupId
                      ),
                    }
                  : option
              ),
            }
          : category
      ),
    }));
  }

  function handleImage(file, setter) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5 MB.");
      return;
    }

    setter(URL.createObjectURL(file));
    setMessage("");
  }

  // DOWNLOAD A LOCAL JSON CONFIGURATION
  function exportDraft() {
    const config = {
      ...form,
      logoSelected: Boolean(logo),
      posterSelected: Boolean(poster),
      status: "draft",
    };

    const blob = new Blob(
      [JSON.stringify(config, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rudraksh-registration-draft.json";
    link.click();

    URL.revokeObjectURL(url);

    setMessage("Draft configuration downloaded successfully!");
  }

  // SAVE REGISTRATION FORM TO DATABASE
  async function saveDraft() {
    if (saving || savedFormId) return;
    if (saving) return;

    setMessage("");

    if (!form.eventTitle.trim()) {
      setMessage("Please enter the Event Title.");
      return;
    }

    if (!form.title.trim()) {
      setMessage("Please enter the Registration Form Title.");
      return;
    }

    if (!form.categories.length) {
      setMessage("Please add at least one main category.");
      return;
    }

    for (let i = 0; i < form.categories.length; i++) {
      const category = form.categories[i];

      if (!category.name.trim()) {
        setMessage(`Please enter a name for Category ${i + 1}.`);
        return;
      }

      if (!Array.isArray(category.options)) {
        setMessage(`Invalid options in Category ${i + 1}.`);
        return;
      }

      for (let j = 0; j < category.options.length; j++) {
        if (!category.options[j].name.trim()) {
          setMessage(
            `Please enter a name for Option ${j + 1} in ${category.name}.`
          );
          return;
        }

        for (
          let k = 0;
          k < category.options[j].groups.length;
          k++
        ) {
          const group = category.options[j].groups[k];

          if (!group.name.trim()) {
            setMessage(
              `Please enter a name for Group ${k + 1} in ${category.options[j].name}.`
            );
            return;
          }
        }
      }
    }

    const registrationFee = form.free ? 0 : Number(form.fee);

    if (!Number.isFinite(registrationFee) || registrationFee < 0) {
      setMessage("Please enter a valid registration fee.");
      return;
    }

    const formData = {
      eventTitle: form.eventTitle.trim(),
      title: form.title.trim(),
      description: form.description,
      fee: registrationFee,
      deadline: form.deadline || null,
      instructions: form.instructions,
      theme: form.theme,
      categories: form.categories,
    };

    try {
      setSaving(true);

      const result = await saveRegistrationForm(formData);

      if (result.success) {
        setSavedFormId(result.formId);
        setMessage(
          `SUCCESS! Your registration form has been saved as a draft. Form ID: ${result.formId}`
        );
      } else {
        setMessage(result.message || "Unable to save your form.");
      }
    } catch (error) {
      console.error("Save registration form error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to connect to the registration server.";

      setMessage(`ERROR: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }

  function previewForm() {
    if (!form.title.trim()) {
      setMessage("Please enter a form title first.");
      return;
    }

    setMessage(
      "Preview configuration is ready. Public preview integration is our next step."
    );
  }

  function publishForm() {
    setMessage(
      "Your form is saved separately as a draft. Publishing will be implemented after the draft workflow is tested."
    );
  }

  return (
    <main className="builder-page">
      <header className="builder-header">
        <button
          className="builder-back"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={17} /> BACK TO DASHBOARD
        </button>

        <h1>🌸 CREATE NEW REGISTRATION 🌸</h1>
        <p>Make your own registration form!</p>
      </header>

      {message && (
        <div className="builder-message">
          {message}
        </div>
      )}

      {/* 1. FORM INFORMATION */}
      <section className="builder-section">
        <h2>📝 1. FORM INFORMATION</h2>

        <label>Event Title</label>
        <input
          value={form.eventTitle}
          onChange={(e) =>
            updateForm("eventTitle", e.target.value)
          }
          placeholder="Example: Rudraksh Utsav 2026"
        />

        <label>Registration Form Title</label>
        <input
          value={form.title}
          onChange={(e) =>
            updateForm("title", e.target.value)
          }
          placeholder="Example: Utsav 2026 Dance Registration"
        />

        <label>Form Description</label>
        <textarea
          value={form.description}
          onChange={(e) =>
            updateForm("description", e.target.value)
          }
          placeholder="Write about your event..."
          rows={4}
        />

        <label>Registration Deadline</label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) =>
            updateForm("deadline", e.target.value)
          }
        />

        <label>Instructions for Participants</label>
        <textarea
          value={form.instructions}
          onChange={(e) =>
            updateForm("instructions", e.target.value)
          }
          placeholder="Write important instructions..."
          rows={4}
        />
      </section>

      {/* 2. EVENT LOGO AND POSTER */}
      <section className="builder-section">
        <h2>🖼️ 2. EVENT LOGO & POSTER</h2>

        <label>Upload Event Logo</label>

        <div className="builder-upload">
          <Upload size={22} />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImage(e.target.files[0], setLogo)
            }
          />
        </div>

        {logo && (
          <img
            className="builder-logo-preview"
            src={logo}
            alt="Event logo preview"
          />
        )}

        <label>Upload Event Poster</label>

        <div className="builder-upload">
          <Image size={22} />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImage(e.target.files[0], setPoster)
            }
          />
        </div>

        {poster && (
          <img
            className="builder-poster-preview"
            src={poster}
            alt="Event poster preview"
          />
        )}
      </section>

      {/* 3. REGISTRATION FEES */}
      <section className="builder-section">
        <h2>💰 3. REGISTRATION FEES</h2>

        <label>
          <input
            type="checkbox"
            checked={form.free}
            onChange={(e) =>
              updateForm("free", e.target.checked)
            }
          />
          Free Registration
        </label>

        {!form.free && (
          <>
            <label>Registration Fee (₹)</label>
            <input
              type="number"
              min="1"
              value={form.fee}
              onChange={(e) =>
                updateForm(
                  "fee",
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
            />
          </>
        )}
      </section>

      {/* 4. PUBLIC WEBSITE THEME */}
      <section className="builder-section">
        <h2>🎨 4. SELECT PUBLIC WEBSITE THEME</h2>

        <p className="builder-help">
          This theme changes the appearance of the public
          registration form, not your colourful admin panel.
        </p>

        <div className="builder-themes">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-option ${
                form.theme === theme.id ? "selected-theme" : ""
              }`}
              onClick={() =>
                updateForm("theme", theme.id)
              }
            >
              <span
                className="theme-swatch"
                style={{
                  background: theme.color,
                  color: theme.background,
                }}
              />

              {theme.name}
              {form.theme === theme.id && " ✓"}
            </button>
          ))}
        </div>
      </section>

      {/* 5. MAIN REGISTRATION CATEGORIES */}
      <section className="builder-section">
        <h2>📋 5. MAIN REGISTRATION CATEGORIES</h2>

        <p className="builder-help">
          Add your main categories, then add options and
          groups inside them.
        </p>

        {form.categories.map((category, categoryIndex) => (
          <div
            className="category-builder"
            key={category.id}
          >
            <div className="builder-item-heading">
              <h3>Category {categoryIndex + 1}</h3>

              <button
                className="builder-delete"
                onClick={() =>
                  removeCategory(category.id)
                }
              >
                <Trash2 size={16} /> DELETE
              </button>
            </div>

            <label>Category Name</label>

            <input
              value={category.name}
              onChange={(e) =>
                updateCategory(category.id, e.target.value)
              }
              placeholder="Example: DANCE"
            />

            <h4>Category Options</h4>

            {category.options.map((option, optionIndex) => (
              <div
                className="option-builder"
                key={option.id}
              >
                <div className="builder-item-heading">
                  <strong>Option {optionIndex + 1}</strong>

                  <button
                    className="builder-delete"
                    onClick={() =>
                      removeOption(category.id, option.id)
                    }
                  >
                    <Trash2 size={15} /> DELETE
                  </button>
                </div>

                <input
                  value={option.name}
                  onChange={(e) =>
                    updateOption(
                      category.id,
                      option.id,
                      e.target.value
                    )
                  }
                  placeholder="Example: Rabindra Nritya"
                />

                <h4>Groups</h4>

                {option.groups.map((group, groupIndex) => (
                  <div
                    className="group-builder"
                    key={group.id}
                  >
                    <div className="builder-item-heading">
                      <strong>Group {groupIndex + 1}</strong>

                      <button
                        className="builder-delete"
                        onClick={() =>
                          removeGroup(
                            category.id,
                            option.id,
                            group.id
                          )
                        }
                      >
                        <Trash2 size={14} /> DELETE
                      </button>
                    </div>

                    <input
                      value={group.name}
                      onChange={(e) =>
                        updateGroup(
                          category.id,
                          option.id,
                          group.id,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Example: Group A"
                    />

                    <input
                      value={group.eligibility}
                      onChange={(e) =>
                        updateGroup(
                          category.id,
                          option.id,
                          group.id,
                          "eligibility",
                          e.target.value
                        )
                      }
                      placeholder="Example: Nursery to KG-II"
                    />
                  </div>
                ))}

                <button
                  className="builder-add"
                  onClick={() =>
                    addGroup(category.id, option.id)
                  }
                >
                  <Plus size={16} /> ADD GROUP
                </button>
              </div>
            ))}

            <button
              className="builder-add"
              onClick={() => addOption(category.id)}
            >
              <Plus size={16} /> ADD OPTION
            </button>
          </div>
        ))}

        <button
          className="builder-add main-add"
          onClick={addCategory}
        >
          <Plus size={18} /> ADD MAIN CATEGORY
        </button>
      </section>

      {/* 6. ACTIONS */}
      <section className="builder-actions">
        <button
  className="builder-save"
  onClick={saveDraft}
  disabled={saving || Boolean(savedFormId)}
>
  <Save size={17} />
  {saving
    ? "SAVING..."
    : savedFormId
      ? "SAVED ✓"
      : "SAVE DRAFT"}
</button>

        <button
          className="builder-preview"
          onClick={previewForm}
        >
          <Eye size={17} /> PREVIEW
        </button>

        <button
          className="builder-publish"
          onClick={publishForm}
        >
          <Globe size={17} /> PUBLISH FORM
        </button>

        <button
          className="builder-add"
          onClick={exportDraft}
        >
          <Save size={17} /> DOWNLOAD JSON
        </button>
      </section>
    </main>
  );
}

export default CreateForm;
