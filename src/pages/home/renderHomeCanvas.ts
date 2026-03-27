import type { CanvasSettings, CellType, ImageData, ImageSections, SectionKey } from './types';

interface RenderImage extends ImageData {
  section: SectionKey;
  cellType?: CellType;
}

interface RowItem extends RenderImage {
  aspect: number;
}

interface CanvasRow {
  items: RowItem[];
  gaps: number[];
  height: number;
  isFullWidth: boolean;
}

interface RenderCanvasResult {
  ok: boolean;
  error?: string;
}

const INNER_GAP = 8;
const MAX_CANVAS_DIM = 16000;
const WHITE = '#ffffff';

const getAspect = ({ imgElement }: ImageData) => {
  if (imgElement.naturalHeight === 0) {
    return 1;
  }

  return imgElement.naturalWidth / imgElement.naturalHeight;
};

const withSection = (section: SectionKey, images: ImageData[], cellType?: CellType): RenderImage[] =>
  images.map((image) => ({ ...image, section, cellType }));

const buildBaseItems = (sections: ImageSections) => [
  ...withSection('header', sections.header),
  ...withSection('profile', sections.profile),
  ...withSection('midVIP', sections.midVIP, 'vip'),
  ...withSection('midSkins', sections.midSkins, 'skin'),
  ...withSection('footer', sections.footer, 'footer'),
];

const buildFinalItems = (sections: ImageSections, targetAspectPerRow: number) => {
  const remainingSkins = [...sections.midSkins];
  const fillerImages: ImageData[] = [];
  let currentHeaderAspect = 0;

  sections.header.forEach((image) => {
    currentHeaderAspect += getAspect(image);

    if (currentHeaderAspect >= targetAspectPerRow) {
      currentHeaderAspect = 0;
    }
  });

  if (currentHeaderAspect > 0 && currentHeaderAspect < targetAspectPerRow) {
    let neededAspect = targetAspectPerRow - currentHeaderAspect;

    while (neededAspect > 0 && remainingSkins.length > 0) {
      const skinImage = remainingSkins.shift();

      if (!skinImage) {
        break;
      }

      fillerImages.push(skinImage);
      neededAspect -= getAspect(skinImage);
    }
  }

  return [
    ...withSection('header', sections.header),
    ...withSection('header', fillerImages, 'skin'),
    ...withSection('profile', sections.profile),
    ...withSection('midVIP', sections.midVIP, 'vip'),
    ...withSection('midSkins', remainingSkins, 'skin'),
    ...withSection('footer', sections.footer, 'footer'),
  ];
};

const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

const drawGroupBorder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.restore();
};

const drawItem = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fit: 'cover' | 'contain' | 'stretch',
  borderWidth = 0,
  borderColor = '',
) => {
  if (width <= 0 || height <= 0) {
    return;
  }

  ctx.save();
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.clip();

  const imageWidth = image.naturalWidth;
  const imageHeight = image.naturalHeight;

  if (fit === 'stretch') {
    ctx.drawImage(image, x, y, width, height);
  } else {
    const scale =
      fit === 'contain'
        ? Math.min(width / imageWidth, height / imageHeight)
        : Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  ctx.restore();

  if (borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.stroke();
    ctx.restore();
  }
};

const getItemFit = (item: RenderImage) => {
  if (item.cellType === 'vip') {
    return 'contain' as const;
  }

  if (item.section === 'header' || item.section === 'profile') {
    return 'cover' as const;
  }

  return 'stretch' as const;
};

export function renderHomeCanvas(
  canvas: HTMLCanvasElement,
  sections: ImageSections,
  settings: CanvasSettings,
): RenderCanvasResult {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { ok: false, error: 'Không thể khởi tạo canvas.' };
  }

  const baseItems = buildBaseItems(sections);

  if (baseItems.length === 0) {
    return { ok: false, error: 'Vui lòng thêm ít nhất 1 ảnh!' };
  }

  const canvasWidth = settings.width;
  const rowGap = settings.gap > 0 ? settings.gap : INNER_GAP;
  const contentWidth = canvasWidth - settings.padding * 2;

  if (contentWidth <= 0) {
    return { ok: false, error: 'Kích thước canvas không hợp lệ.' };
  }

  const totalAspect = baseItems.reduce((sum, item) => sum + getAspect(item), 0);
  const targetRatio = 1.7777;
  const baseTargetHeight = Math.max(
    35,
    Math.min(600, Math.sqrt((contentWidth * contentWidth) / (totalAspect * targetRatio))),
  );
  const targetRowCount = Math.max(1, Math.round(totalAspect / (contentWidth / baseTargetHeight)));
  const targetAspectPerRow = totalAspect / targetRowCount;
  const items = buildFinalItems(sections, targetAspectPerRow);

  const rows: CanvasRow[] = [];
  let currentItems: RowItem[] = [];
  let currentAspect = 0;

  items.forEach((item, index) => {
    const aspect = getAspect(item);

    currentItems.push({
      ...item,
      aspect,
    });
    currentAspect += aspect;

    const isLastItem = index === items.length - 1;
    const nextItem = items[index + 1];
    const mustBreakBetweenSections =
      item.section === 'header' && nextItem !== undefined && nextItem.section !== 'header';

    let shouldBreakNaturally = false;

    if (!isLastItem && nextItem && !mustBreakBetweenSections && rows.length < targetRowCount - 1) {
      const distanceNow = Math.abs(currentAspect - targetAspectPerRow);
      const distanceWithNext = Math.abs(currentAspect + getAspect(nextItem) - targetAspectPerRow);

      if (currentAspect >= targetAspectPerRow || distanceWithNext > distanceNow) {
        shouldBreakNaturally = true;
      }
    }

    if (isLastItem || mustBreakBetweenSections || shouldBreakNaturally) {
      const gaps: number[] = currentItems.map((rowItem, rowIndex) => {
        if (rowIndex === 0) {
          return 0;
        }

        const previousItem = currentItems[rowIndex - 1];
        const isJoinedSkinGroup =
          (previousItem.cellType === 'skin' || previousItem.cellType === 'footer') &&
          (rowItem.cellType === 'skin' || rowItem.cellType === 'footer');

        return isJoinedSkinGroup ? 0 : INNER_GAP;
      });

      const totalGapWidth = gaps.reduce((sum, gapWidth) => sum + gapWidth, 0);
      let rowHeight = (contentWidth - totalGapWidth) / currentAspect;
      let isFullWidth = true;

      if (!Number.isFinite(rowHeight) || rowHeight <= 0) {
        rowHeight = baseTargetHeight;
      }

      if (isLastItem && rowHeight > baseTargetHeight * 3) {
        rowHeight = baseTargetHeight * 1.5;
        isFullWidth = false;
      }

      rows.push({
        items: currentItems,
        gaps,
        height: rowHeight,
        isFullWidth,
      });

      currentItems = [];
      currentAspect = 0;
    }
  });

  const totalHeight = rows.reduce((sum, row, rowIndex) => {
    const currentHeight = sum + row.height;
    return rowIndex < rows.length - 1 ? currentHeight + rowGap : currentHeight;
  }, settings.padding * 2);

  let scale = 1;

  if (totalHeight > MAX_CANVAS_DIM || canvasWidth > MAX_CANVAS_DIM) {
    scale = Math.min(MAX_CANVAS_DIM / totalHeight, MAX_CANVAS_DIM / canvasWidth);
  }

  canvas.width = Math.ceil(canvasWidth * scale);
  canvas.height = Math.ceil(totalHeight * scale);

  ctx.fillStyle = settings.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(scale, scale);

  if (settings.borderWidth > 0) {
    ctx.lineWidth = settings.borderWidth;

    if (settings.borderStyle === 'solid') {
      ctx.strokeStyle = settings.borderColor;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, totalHeight);
      gradient.addColorStop(0, '#ff0cfa');
      gradient.addColorStop(1, '#00f6ff');
      ctx.strokeStyle = gradient;
    }

    roundRectPath(
      ctx,
      settings.borderWidth / 2,
      settings.borderWidth / 2,
      canvasWidth - settings.borderWidth,
      totalHeight - settings.borderWidth,
      settings.radius,
    );
    ctx.stroke();
  }

  let currentY = settings.padding;

  rows.forEach((row) => {
    const rowHeight = row.height;
    let currentX = settings.padding;

    if (!row.isFullWidth) {
      const rowWidth = row.items.reduce(
        (sum, item, itemIndex) => sum + item.aspect * rowHeight + row.gaps[itemIndex],
        0,
      );
      currentX = settings.padding + (contentWidth - rowWidth) / 2;
    }

    let skinGroup: { x: number; width: number } | null = null;

    for (let itemIndex = 0; itemIndex < row.items.length; itemIndex += 1) {
      const item = row.items[itemIndex];
      currentX += row.gaps[itemIndex];

      const itemWidth = item.aspect * rowHeight;
      const isHeader = item.section === 'header';
      const isProfile = item.section === 'profile';
      const isSkinLike = item.cellType === 'skin' || item.cellType === 'footer';
      const individualBorder = isHeader && !isSkinLike ? 1 : isProfile ? 1 : 0;
      const itemBorderColor = isHeader || isProfile ? WHITE : settings.borderColor;
      const imagePadding = item.cellType === 'vip' ? 4 : 0;
      const drawX = Math.round(currentX + imagePadding);
      const drawY = Math.round(currentY + imagePadding);
      const drawWidth = Math.round(itemWidth - imagePadding * 2);
      const drawHeight = Math.round(rowHeight - imagePadding * 2);

      drawItem(
        ctx,
        item.imgElement,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        settings.radius,
        getItemFit(item),
        individualBorder,
        itemBorderColor,
      );

      if (isSkinLike) {
        if (skinGroup) {
          skinGroup.width += itemWidth + row.gaps[itemIndex];
        } else {
          skinGroup = {
            x: currentX,
            width: itemWidth,
          };
        }
      } else if (skinGroup) {
        drawGroupBorder(ctx, skinGroup.x, currentY, skinGroup.width, rowHeight, settings.radius, WHITE);
        skinGroup = null;
      }

      currentX += itemWidth;
    }

    const finalSkinGroup = skinGroup;

    if (finalSkinGroup) {
      drawGroupBorder(
        ctx,
        finalSkinGroup.x,
        currentY,
        finalSkinGroup.width,
        rowHeight,
        settings.radius,
        WHITE,
      );
    }

    currentY += rowHeight + rowGap;
  });

  ctx.restore();

  return { ok: true };
}
