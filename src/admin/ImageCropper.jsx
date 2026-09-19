import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  RotateCcw,
  X,
} from "lucide-react";

import "./ImageCropper.css";

const CROP_RATIOS = [
  {
    label: "4:3",
    value: 4 / 3,
  },
  {
    label: "16:9",
    value: 16 / 9,
  },
  {
    label: "1:1",
    value: 1,
  },
];

function ImageCropper({
  file,
  initialRatio = "16:9",
  onApply,
  onCancel,
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [imageUrl, setImageUrl] =
    useState("");

  const [imageLoaded, setImageLoaded] =
    useState(false);

  const [selectedRatio, setSelectedRatio] =
    useState(initialRatio);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentRatio = useMemo(() => {
    return (
      CROP_RATIOS.find(
        (item) =>
          item.label === selectedRatio
      ) || CROP_RATIOS[1]
    );
  }, [selectedRatio]);

  /* =========================================================
     CREATE OBJECT URL
  ========================================================= */

  useEffect(() => {
    if (!file) {
      setImageUrl("");
      setImageLoaded(false);
      return;
    }

    setImageLoaded(false);
    setError("");

    const url =
      URL.createObjectURL(file);

    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  /* =========================================================
     CALCULATE CENTER CROP
  ========================================================= */

  const calculateCrop = (
    imageWidth,
    imageHeight,
    ratio
  ) => {
    const imageRatio =
      imageWidth / imageHeight;

    let cropWidth;
    let cropHeight;

    if (imageRatio > ratio) {
      cropHeight =
        imageHeight;

      cropWidth =
        cropHeight * ratio;
    } else {
      cropWidth =
        imageWidth;

      cropHeight =
        cropWidth / ratio;
    }

    const cropX =
      (imageWidth - cropWidth) /
      2;

    const cropY =
      (imageHeight - cropHeight) /
      2;

    return {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
    };
  };

  /* =========================================================
     DRAW PREVIEW
  ========================================================= */

  const drawPreview = () => {
    const canvas =
      canvasRef.current;

    const image =
      imageRef.current;

    if (
      !canvas ||
      !image ||
      !imageLoaded
    ) {
      return;
    }

    const imageWidth =
      image.naturalWidth;

    const imageHeight =
      image.naturalHeight;

    if (
      !imageWidth ||
      !imageHeight
    ) {
      return;
    }

    const {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
    } = calculateCrop(
      imageWidth,
      imageHeight,
      currentRatio.value
    );

    const maxWidth = 900;
    const maxHeight = 520;

    let previewWidth =
      cropWidth;

    let previewHeight =
      cropHeight;

    if (
      previewWidth >
      maxWidth
    ) {
      const scale =
        maxWidth /
        previewWidth;

      previewWidth *= scale;
      previewHeight *= scale;
    }

    if (
      previewHeight >
      maxHeight
    ) {
      const scale =
        maxHeight /
        previewHeight;

      previewWidth *= scale;
      previewHeight *= scale;
    }

    canvas.width = Math.max(
      1,
      Math.round(previewWidth)
    );

    canvas.height = Math.max(
      1,
      Math.round(previewHeight)
    );

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  /* =========================================================
     REDRAW WHEN RATIO CHANGES
  ========================================================= */

  useEffect(() => {
    if (!imageLoaded) {
      return;
    }

    requestAnimationFrame(
      drawPreview
    );
  }, [
    selectedRatio,
    imageLoaded,
  ]);

  /* =========================================================
     IMAGE LOAD
  ========================================================= */

  const handleImageLoad = (
    event
  ) => {
    const image =
      event.currentTarget;

    imageRef.current =
      image;

    setImageLoaded(true);
    setError("");

    requestAnimationFrame(
      drawPreview
    );
  };

  /* =========================================================
     CHANGE RATIO
  ========================================================= */

  const handleRatioChange = (
    event,
    ratio
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (processing) {
      return;
    }

    setError("");

    setSelectedRatio(
      ratio.label
    );
  };

  /* =========================================================
     APPLY CROP
  ========================================================= */

  const handleApply = async (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (processing) {
      return;
    }

    const image =
      imageRef.current;

    if (
      !image ||
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      setError(
        "Image is not ready yet. Please wait a moment."
      );

      return;
    }

    try {
      setProcessing(true);
      setError("");

      const imageWidth =
        image.naturalWidth;

      const imageHeight =
        image.naturalHeight;

      const {
        cropX,
        cropY,
        cropWidth,
        cropHeight,
      } = calculateCrop(
        imageWidth,
        imageHeight,
        currentRatio.value
      );

      /*
        Keep output reasonably sized.
      */

      const MAX_SIZE = 2400;

      let outputWidth =
        Math.round(cropWidth);

      let outputHeight =
        Math.round(cropHeight);

      if (
        outputWidth >
          MAX_SIZE ||
        outputHeight >
          MAX_SIZE
      ) {
        const scale =
          Math.min(
            MAX_SIZE /
              outputWidth,
            MAX_SIZE /
              outputHeight
          );

        outputWidth =
          Math.round(
            outputWidth *
              scale
          );

        outputHeight =
          Math.round(
            outputHeight *
              scale
          );
      }

      const outputCanvas =
        document.createElement(
          "canvas"
        );

      outputCanvas.width =
        Math.max(
          1,
          outputWidth
        );

      outputCanvas.height =
        Math.max(
          1,
          outputHeight
        );

      const context =
        outputCanvas.getContext(
          "2d"
        );

      if (!context) {
        throw new Error(
          "Unable to create image canvas."
        );
      }

      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        "high";

      context.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputCanvas.width,
        outputCanvas.height
      );

      /* =====================================================
         CANVAS → BLOB
      ===================================================== */

      const blob =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            outputCanvas.toBlob(
              (result) => {
                if (!result) {
                  reject(
                    new Error(
                      "The browser could not create the cropped image."
                    )
                  );

                  return;
                }

                resolve(result);
              },
              "image/jpeg",
              0.92
            );
          }
        );

      /* =====================================================
         CREATE FILE
      ===================================================== */

      const originalName =
        file?.name ||
        "member-image";

      const baseName =
        originalName
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          )
          .slice(
            0,
            60
          ) ||
        "member-image";

      const ratioName =
        selectedRatio.replace(
          ":",
          "x"
        );

      const croppedFile =
        new File(
          [blob],
          `${baseName}-${ratioName}.jpg`,
          {
            type: "image/jpeg",
            lastModified:
              Date.now(),
          }
        );

      /* =====================================================
         CREATE PREVIEW
      ===================================================== */

      const previewUrl =
        URL.createObjectURL(
          blob
        );

      /*
        IMPORTANT:
        Members.jsx receives an OBJECT,
        not just the File.
      */

      onApply({
        file: croppedFile,
        preview: previewUrl,
        name: croppedFile.name,
        ratio: selectedRatio,
        width:
          outputCanvas.width,
        height:
          outputCanvas.height,
      });
    } catch (cropError) {
      console.error(
        "CROP ERROR:",
        cropError
      );

      setError(
        cropError?.message ||
          "Unable to crop image."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* =========================================================
     CANCEL
  ========================================================= */

  const handleCancel = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (processing) {
      return;
    }

    onCancel();
  };

  /* =========================================================
     RESET
  ========================================================= */

  const handleReset = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (processing) {
      return;
    }

    setSelectedRatio(
      initialRatio
    );

    setError("");
  };

  if (!file) {
    return null;
  }

  return (
    <div
      className="image-cropper-overlay"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        className="image-cropper-modal"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* HEADER */}

        <div className="image-cropper-header">
          <div>
            <span className="image-cropper-kicker">
              IMAGE CROP
            </span>

            <h2>
              Frame Your Image
            </h2>

            <p>
              Choose a fixed frame
              size. The crop is
              centered automatically.
            </p>
          </div>

          <button
            type="button"
            className="image-cropper-close"
            onClick={
              handleCancel
            }
            disabled={
              processing
            }
          >
            <X size={20} />
          </button>
        </div>

        {/* RATIO */}

        <div className="image-cropper-controls">
          <div className="image-cropper-control-title">
            FRAME SIZE
          </div>

          <div className="image-cropper-ratio-buttons">
            {CROP_RATIOS.map(
              (ratio) => (
                <button
                  key={
                    ratio.label
                  }
                  type="button"
                  className={`image-cropper-ratio-button ${
                    selectedRatio ===
                    ratio.label
                      ? "active"
                      : ""
                  }`}
                  onClick={(
                    event
                  ) =>
                    handleRatioChange(
                      event,
                      ratio
                    )
                  }
                  disabled={
                    processing
                  }
                >
                  {ratio.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* PREVIEW */}

        <div className="image-cropper-preview">
          {!imageLoaded && (
            <div className="image-cropper-loading">
              Loading image...
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`image-cropper-canvas ${
              imageLoaded
                ? "visible"
                : ""
            }`}
          />

          <img
            src={imageUrl}
            alt=""
            onLoad={
              handleImageLoad
            }
            style={{
              display:
                "none",
            }}
          />
        </div>

        {/* INFO */}

        <div className="image-cropper-info">
          <span>
            <strong>
              Crop:
            </strong>{" "}
            centered automatically
          </span>

          <span>
            <strong>
              Frame:
            </strong>{" "}
            {selectedRatio}
          </span>

          <span>
            <strong>
              Custom crop:
            </strong>{" "}
            disabled
          </span>
        </div>

        {/* ERROR */}

        {error && (
          <div className="image-cropper-error">
            {error}
          </div>
        )}

        {/* FOOTER */}

        <div className="image-cropper-footer">
          <button
            type="button"
            className="image-cropper-reset"
            onClick={
              handleReset
            }
            disabled={
              processing
            }
          >
            <RotateCcw
              size={14}
            />

            Reset
          </button>

          <div className="image-cropper-footer-right">
            <button
              type="button"
              className="image-cropper-cancel"
              onClick={
                handleCancel
              }
              disabled={
                processing
              }
            >
              <X size={14} />

              Cancel
            </button>

            <button
              type="button"
              className="image-cropper-apply"
              onClick={
                handleApply
              }
              disabled={
                processing ||
                !imageLoaded
              }
            >
              {processing ? (
                <>
                  <span className="image-cropper-spinner" />

                  Processing...
                </>
              ) : (
                <>
                  <Check
                    size={15}
                  />

                  Apply{" "}
                  {selectedRatio}{" "}
                  Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;