import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
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
  {
    label: "CUSTOM",
    value: null,
  },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;
const MAX_OUTPUT_SIZE = 2400;

function ImageCropper({
  file,
  initialRatio = "16:9",
  onApply,
  onCancel,
}) {
  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const cropInteractionRef = useRef({
    active: false,
    mode: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startCrop: null,
  });

  const [imageUrl, setImageUrl] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const [selectedRatio, setSelectedRatio] =
    useState(initialRatio);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [previewSize, setPreviewSize] = useState({
    width: 0,
    height: 0,
  });

  const [customCrop, setCustomCrop] = useState(null);

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

    setZoom(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setCustomCrop(null);

    const url = URL.createObjectURL(file);

    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  /* =========================================================
     OBSERVE PREVIEW SIZE
  ========================================================= */

  useEffect(() => {
    const element = previewRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect =
        element.getBoundingClientRect();

      setPreviewSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer =
      new ResizeObserver(updateSize);

    observer.observe(element);

    window.addEventListener(
      "resize",
      updateSize
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  /* =========================================================
     CROP FRAME
  ========================================================= */

  const getCropRect = useCallback(() => {
    const width = previewSize.width;
    const height = previewSize.height;

    if (!width || !height) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    }

    const padding =
      Math.min(width, height) * 0.04;

    const availableWidth =
      Math.max(
        20,
        width - padding * 2
      );

    const availableHeight =
      Math.max(
        20,
        height - padding * 2
      );

    /*
      CUSTOM MODE
      Completely free crop area.
    */

    if (selectedRatio === "CUSTOM") {
      if (customCrop) {
        return customCrop;
      }

      const customWidth =
        availableWidth * 0.82;

      const customHeight =
        availableHeight * 0.82;

      return {
        x:
          (width - customWidth) /
          2,

        y:
          (height - customHeight) /
          2,

        width: customWidth,
        height: customHeight,
      };
    }

    /*
      FIXED RATIO MODES
    */

    let cropWidth =
      availableWidth;

    let cropHeight =
      cropWidth /
      currentRatio.value;

    if (
      cropHeight >
      availableHeight
    ) {
      cropHeight =
        availableHeight;

      cropWidth =
        cropHeight *
        currentRatio.value;
    }

    return {
      x:
        (width - cropWidth) /
        2,

      y:
        (height - cropHeight) /
        2,

      width: cropWidth,
      height: cropHeight,
    };
  }, [
    previewSize,
    currentRatio.value,
    selectedRatio,
    customCrop,
  ]);

  /* =========================================================
     CALCULATE BASE SCALE
  ========================================================= */

  const getBaseScale = useCallback(
    (
      imageWidth,
      imageHeight,
      cropWidth,
      cropHeight,
      angle
    ) => {
      const radians =
        (angle * Math.PI) /
        180;

      const cos =
        Math.abs(
          Math.cos(radians)
        );

      const sin =
        Math.abs(
          Math.sin(radians)
        );

      const halfCropWidth =
        cropWidth / 2;

      const halfCropHeight =
        cropHeight / 2;

      const corners = [
        {
          x: halfCropWidth,
          y: halfCropHeight,
        },
        {
          x: -halfCropWidth,
          y: halfCropHeight,
        },
        {
          x: halfCropWidth,
          y: -halfCropHeight,
        },
        {
          x: -halfCropWidth,
          y: -halfCropHeight,
        },
      ];

      let requiredScale = 0;

      corners.forEach(
        (corner) => {
          const rotatedX =
            Math.abs(
              corner.x * cos +
                corner.y * sin
            );

          const rotatedY =
            Math.abs(
              corner.x * sin +
                corner.y * cos
            );

          const scaleX =
            rotatedX /
            (imageWidth / 2);

          const scaleY =
            rotatedY /
            (imageHeight / 2);

          requiredScale =
            Math.max(
              requiredScale,
              scaleX,
              scaleY
            );
        }
      );

      return Math.max(
        requiredScale,
        0.01
      );
    },
    []
  );

  /* =========================================================
     CLAMP IMAGE OFFSET
  ========================================================= */

  const clampOffset = useCallback(
    (
      nextX,
      nextY,
      currentZoom = zoom,
      currentRotation = rotation
    ) => {
      const image =
        imageRef.current;

      const crop =
        getCropRect();

      if (
        !image ||
        !crop.width ||
        !crop.height
      ) {
        return {
          x: nextX,
          y: nextY,
        };
      }

      const imageWidth =
        image.naturalWidth;

      const imageHeight =
        image.naturalHeight;

      const baseScale =
        getBaseScale(
          imageWidth,
          imageHeight,
          crop.width,
          crop.height,
          currentRotation
        );

      const renderScale =
        baseScale *
        currentZoom;

      const radians =
        (currentRotation *
          Math.PI) /
        180;

      const cos =
        Math.abs(
          Math.cos(radians)
        );

      const sin =
        Math.abs(
          Math.sin(radians)
        );

      const rotatedWidth =
        imageWidth *
          renderScale *
          cos +
        imageHeight *
          renderScale *
          sin;

      const rotatedHeight =
        imageWidth *
          renderScale *
          sin +
        imageHeight *
          renderScale *
          cos;

      const maxX = Math.max(
        0,
        (rotatedWidth -
          crop.width) /
          2
      );

      const maxY = Math.max(
        0,
        (rotatedHeight -
          crop.height) /
          2
      );

      return {
        x: Math.max(
          -maxX,
          Math.min(
            maxX,
            nextX
          )
        ),

        y: Math.max(
          -maxY,
          Math.min(
            maxY,
            nextY
          )
        ),
      };
    },
    [
      getCropRect,
      getBaseScale,
      zoom,
      rotation,
    ]
  );

  /* =========================================================
     DRAW CANVAS
  ========================================================= */

  const drawCanvas = useCallback(() => {
    const canvas =
      canvasRef.current;

    const image =
      imageRef.current;

    if (
      !canvas ||
      !image ||
      !imageLoaded ||
      !previewSize.width ||
      !previewSize.height
    ) {
      return;
    }

    const displayWidth =
      previewSize.width;

    const displayHeight =
      previewSize.height;

    const dpr =
      Math.min(
        window.devicePixelRatio ||
          1,
        2
      );

    canvas.width =
      Math.max(
        1,
        Math.round(
          displayWidth * dpr
        )
      );

    canvas.height =
      Math.max(
        1,
        Math.round(
          displayHeight * dpr
        )
      );

    canvas.style.width =
      `${displayWidth}px`;

    canvas.style.height =
      `${displayHeight}px`;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    context.clearRect(
      0,
      0,
      displayWidth,
      displayHeight
    );

    context.fillStyle =
      "#0d0d0d";

    context.fillRect(
      0,
      0,
      displayWidth,
      displayHeight
    );

    const crop =
      getCropRect();

    if (
      !crop.width ||
      !crop.height
    ) {
      return;
    }

    const baseScale =
      getBaseScale(
        image.naturalWidth,
        image.naturalHeight,
        crop.width,
        crop.height,
        rotation
      );

    const renderScale =
      baseScale * zoom;

    const centerX =
      displayWidth / 2 +
      offsetX;

    const centerY =
      displayHeight / 2 +
      offsetY;

    context.save();

    context.translate(
      centerX,
      centerY
    );

    context.rotate(
      (rotation *
        Math.PI) /
        180
    );

    context.scale(
      renderScale,
      renderScale
    );

    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2,
      image.naturalWidth,
      image.naturalHeight
    );

    context.restore();

    /* =======================================================
       DARKEN OUTSIDE CROP
    ======================================================= */

    context.fillStyle =
      "rgba(0, 0, 0, 0.62)";

    context.fillRect(
      0,
      0,
      displayWidth,
      crop.y
    );

    context.fillRect(
      0,
      crop.y + crop.height,
      displayWidth,
      displayHeight -
        crop.y -
        crop.height
    );

    context.fillRect(
      0,
      crop.y,
      crop.x,
      crop.height
    );

    context.fillRect(
      crop.x + crop.width,
      crop.y,
      displayWidth -
        crop.x -
        crop.width,
      crop.height
    );

    /* =======================================================
       CROP BORDER
    ======================================================= */

    context.strokeStyle =
      "#ffffff";

    context.lineWidth = 2;

    context.strokeRect(
      crop.x,
      crop.y,
      crop.width,
      crop.height
    );

    /* =======================================================
       GRID
    ======================================================= */

    context.strokeStyle =
      "rgba(255,255,255,0.23)";

    context.lineWidth = 1;

    const thirdWidth =
      crop.width / 3;

    const thirdHeight =
      crop.height / 3;

    for (
      let i = 1;
      i < 3;
      i++
    ) {
      context.beginPath();

      context.moveTo(
        crop.x +
          thirdWidth * i,
        crop.y
      );

      context.lineTo(
        crop.x +
          thirdWidth * i,
        crop.y +
          crop.height
      );

      context.stroke();

      context.beginPath();

      context.moveTo(
        crop.x,
        crop.y +
          thirdHeight * i
      );

      context.lineTo(
        crop.x +
          crop.width,
        crop.y +
          thirdHeight * i
      );

      context.stroke();
    }

    /* =======================================================
       CORNER MARKERS
    ======================================================= */

    const cornerLength = 18;

    context.strokeStyle =
      "#e87917";

    context.lineWidth = 3;

    /* top-left */

    context.beginPath();

    context.moveTo(
      crop.x,
      crop.y +
        cornerLength
    );

    context.lineTo(
      crop.x,
      crop.y
    );

    context.lineTo(
      crop.x +
        cornerLength,
      crop.y
    );

    context.stroke();

    /* top-right */

    context.beginPath();

    context.moveTo(
      crop.x +
        crop.width -
        cornerLength,
      crop.y
    );

    context.lineTo(
      crop.x +
        crop.width,
      crop.y
    );

    context.lineTo(
      crop.x +
        crop.width,
      crop.y +
        cornerLength
    );

    context.stroke();

    /* bottom-left */

    context.beginPath();

    context.moveTo(
      crop.x,
      crop.y +
        crop.height -
        cornerLength
    );

    context.lineTo(
      crop.x,
      crop.y +
        crop.height
    );

    context.lineTo(
      crop.x +
        cornerLength,
      crop.y +
        crop.height
    );

    context.stroke();

    /* bottom-right */

    context.beginPath();

    context.moveTo(
      crop.x +
        crop.width -
        cornerLength,
      crop.y +
        crop.height
    );

    context.lineTo(
      crop.x +
        crop.width,
      crop.y +
        crop.height
    );

    context.lineTo(
      crop.x +
        crop.width,
      crop.y +
        crop.height -
        cornerLength
    );

    context.stroke();

    /*
      CUSTOM MODE HANDLE DOTS
    */

    if (
      selectedRatio ===
      "CUSTOM"
    ) {
      const handleSize = 7;

      context.fillStyle =
        "#e87917";

      const handles = [
        [
          crop.x,
          crop.y,
        ],
        [
          crop.x +
            crop.width,
          crop.y,
        ],
        [
          crop.x,
          crop.y +
            crop.height,
        ],
        [
          crop.x +
            crop.width,
          crop.y +
            crop.height,
        ],
        [
          crop.x +
            crop.width / 2,
          crop.y,
        ],
        [
          crop.x +
            crop.width / 2,
          crop.y +
            crop.height,
        ],
        [
          crop.x,
          crop.y +
            crop.height / 2,
        ],
        [
          crop.x +
            crop.width,
          crop.y +
            crop.height / 2,
        ],
      ];

      handles.forEach(
        ([x, y]) => {
          context.fillRect(
            x -
              handleSize / 2,
            y -
              handleSize / 2,
            handleSize,
            handleSize
          );
        }
      );
    }
  }, [
    imageLoaded,
    previewSize,
    getCropRect,
    getBaseScale,
    zoom,
    rotation,
    offsetX,
    offsetY,
    selectedRatio,
  ]);

  /* =========================================================
     REDRAW
  ========================================================= */

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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

    requestAnimationFrame(() => {
      drawCanvas();
    });
  };

  /* =========================================================
     RATIO CHANGE
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

    setSelectedRatio(
      ratio.label
    );

    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    if (
      ratio.label ===
      "CUSTOM"
    ) {
      const width =
        previewSize.width;

      const height =
        previewSize.height;

      if (
        width &&
        height
      ) {
        const padding =
          Math.min(
            width,
            height
          ) * 0.04;

        const availableWidth =
          Math.max(
            20,
            width -
              padding * 2
          );

        const availableHeight =
          Math.max(
            20,
            height -
              padding * 2
          );

        const customWidth =
          availableWidth *
          0.82;

        const customHeight =
          availableHeight *
          0.82;

        setCustomCrop({
          x:
            (width -
              customWidth) /
            2,

          y:
            (height -
              customHeight) /
            2,

          width:
            customWidth,

          height:
            customHeight,
        });
      } else {
        setCustomCrop(null);
      }
    } else {
      setCustomCrop(null);
    }

    setError("");
  };

  /* =========================================================
     ZOOM
  ========================================================= */

  const updateZoom = (
    nextZoom
  ) => {
    const safeZoom =
      Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          Number(nextZoom)
        )
      );

    setZoom(
      safeZoom
    );

    const clamped =
      clampOffset(
        offsetX,
        offsetY,
        safeZoom,
        rotation
      );

    setOffsetX(
      clamped.x
    );

    setOffsetY(
      clamped.y
    );
  };

  const zoomOut = () => {
    updateZoom(
      zoom -
        ZOOM_STEP
    );
  };

  const zoomIn = () => {
    updateZoom(
      zoom +
        ZOOM_STEP
    );
  };

  /* =========================================================
     ROTATE
  ========================================================= */

  const rotateLeft = () => {
    const nextRotation =
      (rotation -
        90 +
        360) %
      360;

    const clamped =
      clampOffset(
        offsetX,
        offsetY,
        zoom,
        nextRotation
      );

    setRotation(
      nextRotation
    );

    setOffsetX(
      clamped.x
    );

    setOffsetY(
      clamped.y
    );
  };

  const rotateRight = () => {
    const nextRotation =
      (rotation +
        90) %
      360;

    const clamped =
      clampOffset(
        offsetX,
        offsetY,
        zoom,
        nextRotation
      );

    setRotation(
      nextRotation
    );

    setOffsetX(
      clamped.x
    );

    setOffsetY(
      clamped.y
    );
  };

  /* =========================================================
     CUSTOM CROP POINTER HELPERS
  ========================================================= */

  const getCustomPointerMode = (
    x,
    y,
    crop
  ) => {
    const edge = 18;

    const nearLeft =
      Math.abs(
        x - crop.x
      ) <= edge;

    const nearRight =
      Math.abs(
        x -
          (crop.x +
            crop.width)
      ) <= edge;

    const nearTop =
      Math.abs(
        y - crop.y
      ) <= edge;

    const nearBottom =
      Math.abs(
        y -
          (crop.y +
            crop.height)
      ) <= edge;

    if (
      nearTop &&
      nearLeft
    ) {
      return "nw";
    }

    if (
      nearTop &&
      nearRight
    ) {
      return "ne";
    }

    if (
      nearBottom &&
      nearLeft
    ) {
      return "sw";
    }

    if (
      nearBottom &&
      nearRight
    ) {
      return "se";
    }

    if (nearTop) {
      return "n";
    }

    if (nearBottom) {
      return "s";
    }

    if (nearLeft) {
      return "w";
    }

    if (nearRight) {
      return "e";
    }

    if (
      x >= crop.x &&
      x <=
        crop.x +
          crop.width &&
      y >= crop.y &&
      y <=
        crop.y +
          crop.height
    ) {
      return "moveCrop";
    }

    return null;
  };

  const updateCustomCrop = (
    mode,
    deltaX,
    deltaY,
    startCrop
  ) => {
    const width =
      previewSize.width;

    const height =
      previewSize.height;

    const padding =
      Math.min(
        width,
        height
      ) * 0.04;

    const minSize = 40;

    const minX =
      padding;

    const minY =
      padding;

    const maxX =
      width - padding;

    const maxY =
      height - padding;

    let left =
      startCrop.x;

    let top =
      startCrop.y;

    let right =
      startCrop.x +
      startCrop.width;

    let bottom =
      startCrop.y +
      startCrop.height;

    if (
      mode ===
      "moveCrop"
    ) {
      const nextLeft =
        Math.max(
          minX,
          Math.min(
            maxX -
              startCrop.width,
            startCrop.x +
              deltaX
          )
        );

      const nextTop =
        Math.max(
          minY,
          Math.min(
            maxY -
              startCrop.height,
            startCrop.y +
              deltaY
          )
        );

      setCustomCrop({
        ...startCrop,
        x: nextLeft,
        y: nextTop,
      });

      return;
    }

    if (
      mode.includes("w")
    ) {
      left =
        Math.max(
          minX,
          Math.min(
            right - minSize,
            left + deltaX
          )
        );
    }

    if (
      mode.includes("e")
    ) {
      right =
        Math.min(
          maxX,
          Math.max(
            left + minSize,
            right + deltaX
          )
        );
    }

    if (
      mode.includes("n")
    ) {
      top =
        Math.max(
          minY,
          Math.min(
            bottom - minSize,
            top + deltaY
          )
        );
    }

    if (
      mode.includes("s")
    ) {
      bottom =
        Math.min(
          maxY,
          Math.max(
            top + minSize,
            bottom + deltaY
          )
        );
    }

    setCustomCrop({
      x: left,
      y: top,
      width:
        right - left,
      height:
        bottom - top,
    });
  };

  /* =========================================================
     POINTER DRAG
  ========================================================= */

  const handlePointerDown = (
    event
  ) => {
    if (
      processing ||
      !imageLoaded
    ) {
      return;
    }

    event.preventDefault();

    /*
      CUSTOM MODE:
      Check whether the user grabbed
      a crop edge/corner first.
    */

    if (
      selectedRatio ===
      "CUSTOM"
    ) {
      const rect =
        event.currentTarget.getBoundingClientRect();

      const pointerX =
        event.clientX -
        rect.left;

      const pointerY =
        event.clientY -
        rect.top;

      const crop =
        getCropRect();

      const mode =
        getCustomPointerMode(
          pointerX,
          pointerY,
          crop
        );

      if (mode) {
        cropInteractionRef.current =
          {
            active: true,
            mode,
            pointerId:
              event.pointerId,
            startX:
              event.clientX,
            startY:
              event.clientY,
            startCrop: {
              ...crop,
            },
          };

        event.currentTarget.setPointerCapture?.(
          event.pointerId
        );

        return;
      }
    }

    /*
      NORMAL IMAGE DRAG
    */

    dragRef.current = {
      active: true,
      pointerId:
        event.pointerId,
      startX:
        event.clientX,
      startY:
        event.clientY,
      startOffsetX:
        offsetX,
      startOffsetY:
        offsetY,
    };

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );
  };

  const handlePointerMove = (
    event
  ) => {
    const customInteraction =
      cropInteractionRef.current;

    if (
      selectedRatio ===
        "CUSTOM" &&
      customInteraction.active &&
      customInteraction.pointerId ===
        event.pointerId
    ) {
      event.preventDefault();

      updateCustomCrop(
        customInteraction.mode,
        event.clientX -
          customInteraction.startX,
        event.clientY -
          customInteraction.startY,
        customInteraction.startCrop
      );

      return;
    }

    const drag =
      dragRef.current;

    if (
      !drag.active ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const deltaX =
      event.clientX -
      drag.startX;

    const deltaY =
      event.clientY -
      drag.startY;

    const nextX =
      drag.startOffsetX +
      deltaX;

    const nextY =
      drag.startOffsetY +
      deltaY;

    const clamped =
      clampOffset(
        nextX,
        nextY
      );

    setOffsetX(
      clamped.x
    );

    setOffsetY(
      clamped.y
    );
  };

  const handlePointerUp = (
    event
  ) => {
    const customInteraction =
      cropInteractionRef.current;

    if (
      customInteraction.pointerId ===
      event.pointerId
    ) {
      cropInteractionRef.current =
        {
          active: false,
          mode: null,
          pointerId: null,
          startX: 0,
          startY: 0,
          startCrop: null,
        };

      event.currentTarget.releasePointerCapture?.(
        event.pointerId
      );

      return;
    }

    const drag =
      dragRef.current;

    if (
      drag.pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    };

    event.currentTarget.releasePointerCapture?.(
      event.pointerId
    );
  };

  /* =========================================================
     MOUSE WHEEL ZOOM
  ========================================================= */

  const handleWheel = (
    event
  ) => {
    if (
      processing ||
      !imageLoaded
    ) {
      return;
    }

    event.preventDefault();

    const direction =
      event.deltaY > 0
        ? -1
        : 1;

    updateZoom(
      zoom +
        direction *
          0.12
    );
  };

  /* =========================================================
     DOUBLE CLICK ZOOM
  ========================================================= */

  const handleDoubleClick = (
    event
  ) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    updateZoom(
      zoom >= 2.8
        ? 1
        : zoom + 0.6
    );
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

    setZoom(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setCustomCrop(null);

    setError("");
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

    const crop =
      getCropRect();

    if (
      !image ||
      !image.naturalWidth ||
      !image.naturalHeight ||
      !crop.width ||
      !crop.height
    ) {
      setError(
        "Image is not ready yet. Please wait a moment."
      );

      return;
    }

    try {
      setProcessing(true);
      setError("");

      const baseScale =
        getBaseScale(
          image.naturalWidth,
          image.naturalHeight,
          crop.width,
          crop.height,
          rotation
        );

      const renderScale =
        baseScale * zoom;

      const estimatedVisibleWidth =
        crop.width /
        renderScale;

      const estimatedVisibleHeight =
        crop.height /
        renderScale;

      let outputWidth;
      let outputHeight;

      /*
        CUSTOM:
        Preserve the manually selected
        crop dimensions.
      */

      if (
        selectedRatio ===
        "CUSTOM"
      ) {
        const naturalWidth =
          Math.max(
            1,
            Math.round(
              estimatedVisibleWidth
            )
          );

        const naturalHeight =
          Math.max(
            1,
            Math.round(
              estimatedVisibleHeight
            )
          );

        const scaleDown =
          Math.min(
            1,
            MAX_OUTPUT_SIZE /
              naturalWidth,
            MAX_OUTPUT_SIZE /
              naturalHeight
          );

        outputWidth =
          Math.max(
            1,
            Math.round(
              naturalWidth *
                scaleDown
            )
          );

        outputHeight =
          Math.max(
            1,
            Math.round(
              naturalHeight *
                scaleDown
            )
          );
      } else {
        /*
          EXISTING FIXED RATIO
          BEHAVIOUR
        */

        outputWidth =
          MAX_OUTPUT_SIZE;

        outputHeight =
          Math.round(
            outputWidth /
              currentRatio.value
          );

        const sourceLimit =
          Math.max(
            estimatedVisibleWidth,
            estimatedVisibleHeight
          );

        if (
          sourceLimit <
          MAX_OUTPUT_SIZE
        ) {
          outputWidth =
            Math.min(
              MAX_OUTPUT_SIZE,
              Math.max(
                800,
                Math.round(
                  estimatedVisibleWidth *
                    renderScale
                )
              )
            );

          outputHeight =
            Math.round(
              outputWidth /
                currentRatio.value
            );
        }

        if (
          currentRatio.value ===
          1
        ) {
          outputWidth =
            outputHeight =
              Math.min(
                MAX_OUTPUT_SIZE,
                2400
              );
        }
      }

      const outputCanvas =
        document.createElement(
          "canvas"
        );

      outputCanvas.width =
        Math.max(
          1,
          Math.round(
            outputWidth
          )
        );

      outputCanvas.height =
        Math.max(
          1,
          Math.round(
            outputHeight
          )
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

      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        outputCanvas.width,
        outputCanvas.height
      );

      /*
        Convert preview coordinates
        into output coordinates.
      */

      const outputScale =
        outputWidth /
        crop.width;

      const outputCenterX =
        outputWidth / 2 +
        offsetX *
          outputScale;

      const outputCenterY =
        outputHeight / 2 +
        offsetY *
          outputScale;

      context.save();

      context.translate(
        outputCenterX,
        outputCenterY
      );

      context.rotate(
        (rotation *
          Math.PI) /
          180
      );

      context.scale(
        renderScale *
          outputScale,
        renderScale *
          outputScale
      );

      context.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight
      );

      context.restore();

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
         FILE NAME
      ===================================================== */

      const originalName =
        file?.name ||
        "gallery-image";

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
        "gallery-image";

      const ratioName =
        selectedRatio ===
        "CUSTOM"
          ? "custom"
          : selectedRatio.replace(
              ":",
              "x"
            );

      const croppedFile =
        new File(
          [blob],
          `${baseName}-${ratioName}.jpg`,
          {
            type:
              "image/jpeg",

            lastModified:
              Date.now(),
          }
        );

      /* =====================================================
         PREVIEW URL
      ===================================================== */

      const previewUrl =
        URL.createObjectURL(
          blob
        );

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
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="image-cropper-header">
          <div>
            <span className="image-cropper-kicker">
              IMAGE EDITOR
            </span>

            <h2>
              Frame Your Image
            </h2>

            <p>
              Drag to reposition,
              zoom and rotate your
              image before saving.
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
            aria-label="Close image editor"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================================
            RATIO
        ================================================== */}

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
                  {
                    ratio.label
                  }
                </button>
              )
            )}
          </div>
        </div>

        {/* ==================================================
            EDITOR
        ================================================== */}

        <div
          ref={previewRef}
          className="image-cropper-preview"
          style={{
            position:
              "relative",

            touchAction:
              "none",

            userSelect:
              "none",

            WebkitUserSelect:
              "none",

            cursor:
              processing
                ? "wait"
                : selectedRatio ===
                  "CUSTOM"
                ? "crosshair"
                : "grab",

            overflow:
              "hidden",
          }}
        >
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
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={
              handlePointerUp
            }
            onPointerCancel={
              handlePointerUp
            }
            onWheel={
              handleWheel
            }
            onDoubleClick={
              handleDoubleClick
            }
            style={{
              display:
                "block",

              width:
                "100%",

              height:
                "100%",

              touchAction:
                "none",

              cursor:
                processing
                  ? "wait"
                  : selectedRatio ===
                    "CUSTOM"
                  ? "crosshair"
                  : dragRef.current
                      .active
                  ? "grabbing"
                  : "grab",
            }}
          />

          <img
            ref={imageRef}
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

          {/* Center hint */}

          {imageLoaded &&
            !processing && (
              <div
                style={{
                  position:
                    "absolute",

                  left:
                    "50%",

                  bottom:
                    "14px",

                  transform:
                    "translateX(-50%)",

                  zIndex: 3,

                  padding:
                    "7px 12px",

                  border:
                    "1px solid rgba(255,255,255,0.18)",

                  background:
                    "rgba(0,0,0,0.5)",

                  color:
                    "rgba(255,255,255,0.82)",

                  fontSize:
                    "10px",

                  fontWeight:
                    700,

                  letterSpacing:
                    "0.08em",

                  textTransform:
                    "uppercase",

                  pointerEvents:
                    "none",

                  backdropFilter:
                    "blur(8px)",

                  WebkitBackdropFilter:
                    "blur(8px)",
                }}
              >
                {selectedRatio ===
                "CUSTOM"
                  ? "Drag edges or corners to crop"
                  : "Drag image to reposition"}
              </div>
            )}
        </div>

        {/* ==================================================
            TOOLS
        ================================================== */}

        <div
          className="image-cropper-editor-tools"
          style={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "14px",

            flexWrap:
              "wrap",

            marginTop:
              "14px",
          }}
        >
          {/* ZOOM */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",

              flex:
                "1 1 260px",
            }}
          >
            <button
              type="button"
              className="image-cropper-tool-button"
              onClick={
                zoomOut
              }
              disabled={
                processing ||
                zoom <=
                  MIN_ZOOM
              }
              aria-label="Zoom out"
            >
              <ZoomOut
                size={16}
              />
            </button>

            <input
              className="image-cropper-zoom-slider"
              type="range"
              min={
                MIN_ZOOM
              }
              max={
                MAX_ZOOM
              }
              step="0.01"
              value={zoom}
              onChange={(
                event
              ) =>
                updateZoom(
                  event.target.value
                )
              }
              disabled={
                processing
              }
              aria-label="Image zoom"
              style={{
                flex: 1,
              }}
            />

            <button
              type="button"
              className="image-cropper-tool-button"
              onClick={
                zoomIn
              }
              disabled={
                processing ||
                zoom >=
                  MAX_ZOOM
              }
              aria-label="Zoom in"
            >
              <ZoomIn
                size={16}
              />
            </button>

            <span
              style={{
                minWidth:
                  "48px",

                textAlign:
                  "right",

                fontSize:
                  "11px",

                fontWeight:
                  700,

                color:
                  "rgba(255,255,255,0.65)",
              }}
            >
              {Math.round(
                zoom * 100
              )}
              %
            </span>
          </div>

          {/* ROTATION */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",
            }}
          >
            <button
              type="button"
              className="image-cropper-tool-button"
              onClick={
                rotateLeft
              }
              disabled={
                processing
              }
              aria-label="Rotate left"
            >
              <RotateCcw
                size={16}
              />
            </button>

            <button
              type="button"
              className="image-cropper-tool-button"
              onClick={
                rotateRight
              }
              disabled={
                processing
              }
              aria-label="Rotate right"
            >
              <RotateCw
                size={16}
              />
            </button>
          </div>
        </div>

        {/* ==================================================
            INFO
        ================================================== */}

        <div className="image-cropper-info">
          <span>
            <strong>
              Drag:
            </strong>{" "}
            reposition
          </span>

          <span>
            <strong>
              Zoom:
            </strong>{" "}
            {Math.round(
              zoom * 100
            )}
            %
          </span>

          <span>
            <strong>
              Rotation:
            </strong>{" "}
            {rotation}°
          </span>

          <span>
            <strong>
              Frame:
            </strong>{" "}
            {selectedRatio}
          </span>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="image-cropper-error">
            {error}
          </div>
        )}

        {/* ==================================================
            FOOTER
        ================================================== */}

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
                !imageLoaded ||
                !previewSize.width
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
                  {
                    selectedRatio
                  }{" "}
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