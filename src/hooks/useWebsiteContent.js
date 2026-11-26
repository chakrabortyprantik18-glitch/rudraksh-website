import { useEffect, useState } from "react";

import { API_URL } from "../config/api";

let contentCache = null;
let contentPromise = null;

export function clearWebsiteContentCache() {
  contentCache = null;
  contentPromise = null;
}

async function fetchWebsiteContent() {
  if (contentCache) {
    return contentCache;
  }

  if (contentPromise) {
    return contentPromise;
  }

  contentPromise = fetch(`${API_URL}/content`)
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to load website content"
        );
      }

      const content = data.content || data.data || {};

      contentCache = content;

      return content;
    })
    .finally(() => {
      contentPromise = null;
    });

  return contentPromise;
}

export function useWebsiteContent(section = null) {
  const [content, setContent] = useState(() => {
    if (!contentCache) {
      return {};
    }

    return section
      ? contentCache[section] || {}
      : contentCache;
  });

  const [loading, setLoading] = useState(!contentCache);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchWebsiteContent();

        if (cancelled) {
          return;
        }

        setContent(
          section
            ? data[section] || {}
            : data
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Website content error:", err);

        setError(
          err?.message ||
            "Unable to load website content"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [section]);

  return {
    content,
    loading,
    error,
  };
}

export function getContentValue(
  content,
  key,
  fallback = ""
) {
  const value = content?.[key];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return value;
}

export function getContentImageUrl(filename) {
  if (!filename) {
    return "";
  }

  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("data:")
  ) {
    return filename;
  }

  const cleanFilename = String(filename).replace(
    /^\/+/,
    ""
  );

  return `${API_URL}/content-image/${encodeURIComponent(
    cleanFilename
  )}`;
}

export default useWebsiteContent;