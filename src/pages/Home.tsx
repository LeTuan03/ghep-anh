import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Trash2, Download, RefreshCw, Layers } from 'lucide-react';
import '../App.css';

interface ImageData {
  id: string;
  src: string;
  file: File;
  imgElement: HTMLImageElement | null;
  cellType?: 'vip' | 'wheel' | 'skin' | 'footer';
}

type SectionKey = 'header' | 'profile' | 'midVIP' | 'midWheel' | 'midSkins' | 'middle' | 'footer';

export default function Home({ onLogout }: { onLogout?: () => void }) {
  const [sections, setSections] = useState<Record<SectionKey, ImageData[]>>({
    header: [],
    profile: [],
    midVIP: [],
    midWheel: [],
    midSkins: [],
    middle: [],
    footer: []
  });

  // Settings layout khít 100% bề ngang
  const [canvasW, setCanvasW] = useState(1920);
  const [canvasH, setCanvasH] = useState(1080);

  const [gap, setGap] = useState(0);
  const [rad, setRad] = useState(0);
  const [bgc, setBgc] = useState('#0b1426');
  const [pad, setPad] = useState(5);
  const [fit, setFit] = useState<'cover' | 'contain' | 'stretch' | 'original'>('cover');
  const [borderColor, setBorderColor] = useState('#373a68');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'gradient1'>('solid');
  const [borderWidth, setBorderWidth] = useState(1);
  const [showDim, setShowDim] = useState(false);

  const [isDragOver, setIsDragOver] = useState<SectionKey | null>(null);
  const [hasRendered, setHasRendered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFiles = (files: FileList | File[], section: SectionKey) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setSections(prev => ({
            ...prev,
            [section]: [
              ...prev[section],
              { id: Math.random().toString(36).substr(2, 9), src, file, imgElement: img }
            ]
          }));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, section: SectionKey) => {
    if (e.target.files) {
      processFiles(e.target.files, section);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (section: SectionKey, index: number) => {
    setSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
    setHasRendered(false);
  };

  const clearAll = () => {
    setSections({ header: [], profile: [], midVIP: [], midWheel: [], midSkins: [], middle: [], footer: [] });
    setHasRendered(false);
  };

  const renderCanvas = () => {
    const { header, profile, midVIP, midWheel, midSkins, middle, footer } = sections;

    const vAll: (ImageData & { section: SectionKey })[] = [
      ...header.map(i => ({ ...i, section: 'header' as SectionKey })),
      ...profile.map(i => ({ ...i, section: 'profile' as SectionKey })),
      ...midVIP.map(i => ({ ...i, section: 'midVIP' as SectionKey, cellType: 'vip' as const })),
      ...midWheel.map(i => ({ ...i, section: 'midWheel' as SectionKey, cellType: 'wheel' as const })),
      ...midSkins.map(i => ({ ...i, section: 'midSkins' as SectionKey, cellType: 'skin' as const })),
      ...middle.map(i => ({ ...i, section: 'middle' as SectionKey, cellType: 'vip' as const })),
      ...footer.map(i => ({ ...i, section: 'footer' as SectionKey, cellType: 'footer' as const }))
    ].filter(i => i.imgElement);

    if (vAll.length === 0) {
      alert('Vui lòng thêm ít nhất 1 ảnh!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvasW;
    const innerPad = 8;
    const rowGap = gap > 0 ? gap : 8;
    const contentW = W - pad * 2;

    const getAsp = (img: HTMLImageElement | null) => img ? img.naturalWidth / img.naturalHeight : 0;

    // --- FILLER/GRID BALANCE LOGIC ---
    const balance = (imgs: ImageData[], cols: number, fillerSource: ImageData[] = imgs) => {
      if (imgs.length === 0) return [];
      const remainder = imgs.length % cols;
      if (remainder === 0) return [...imgs];

      if (remainder < cols / 2 && imgs.length > remainder) {
        // Ít hơn 1 nửa VÀ không phải là toàn bộ ảnh: Bỏ những ảnh thừa
        return imgs.slice(0, imgs.length - remainder);
      } else {
        // Nhiều hơn hoặc bằng 1 nửa: Lấy tương ứng số ảnh ở đầu
        const needed = cols - remainder;
        const res = [...imgs];
        for (let i = 0; i < needed; i++) {
          const originalImg = fillerSource[i % fillerSource.length];
          res.push({
            ...originalImg,
            id: 'fill-' + Math.random().toString(36).substr(2, 5)
          });
        }
        return res;
      }
    };

    // 1. Calculate target aspect per row to hit EXACTLY canvasW x canvasH
    const sumAspect = vAll.reduce((sum, item) => sum + getAsp(item.imgElement), 0);
    const canvasRatio = W / canvasH;
    const idealRows = Math.sqrt(sumAspect / canvasRatio);
    const R = Math.max(1, Math.round(idealRows));
    const targetAspectPerRow = sumAspect / R;

    // Estimate based target height for specific sections
    const baseTargetH = W / targetAspectPerRow;

    // Use dynamic columns for skins/body sections to align with the target HD height
    const skinAspects = midSkins.map(i => getAsp(i.imgElement)).filter(a => a > 0);
    const avgSkinAsp = skinAspects.length > 0 ? (skinAspects.reduce((a, b) => a + b, 0) / skinAspects.length) : 0.75;
    const optimalCols = Math.max(2, Math.round(targetAspectPerRow / avgSkinAsp));

    // 2. Process Header: Decide whether to fill or trim the trailing row based on aspect ratio
    let finalHeader = [...header];
    let trailingHeaderItems: ImageData[] = [];
    let hRowAsp = 0;
    header.forEach(h => {
      let asp = getAsp(h.imgElement);
      hRowAsp += asp;
      trailingHeaderItems.push(h);
      if (hRowAsp >= targetAspectPerRow) {
        hRowAsp = 0;
        trailingHeaderItems = [];
      }
    });

    let skinPool = [...midSkins];

    if (hRowAsp > 0 && header.length > trailingHeaderItems.length) {
      if (hRowAsp < targetAspectPerRow * 0.75) {
        finalHeader = header.slice(0, header.length - trailingHeaderItems.length);
      }
    }

    // 3. Consolidated Body Balancing: Balance all grid-sharing sections as one sequence
    const bodyItems = [
      ...midVIP.map(i => ({ ...i, section: 'midVIP' as SectionKey, cellType: 'vip' as const, gridCols: optimalCols })),
      ...midWheel.map(i => ({ ...i, section: 'midWheel' as SectionKey, cellType: 'wheel' as const, gridCols: optimalCols })),
      ...skinPool.map(i => ({ ...i, section: 'midSkins' as SectionKey, cellType: 'skin' as const, gridCols: optimalCols })),
      ...middle.map(i => ({ ...i, section: 'middle' as SectionKey, cellType: 'vip' as const, gridCols: optimalCols }))
    ];

    let neededBodyForHeader = 0;
    if (finalHeader.length > 0 && bodyItems.length > 0) {
       let currentAsp = 0;
       const targetGridAspect = optimalCols * avgSkinAsp;
       const simItems = [...finalHeader.map(h => getAsp(h.imgElement)), ...bodyItems.map(b => getAsp(b.imgElement))];
       for (let i = 0; i < finalHeader.length; i++) {
           currentAsp += simItems[i];
           if (i === finalHeader.length - 1) {
               let bIdx = 0;
               while (bIdx < bodyItems.length) {
                   const nextAsp = simItems[finalHeader.length + bIdx];
                   const distNow = Math.abs(currentAsp - targetGridAspect);
                   const distNext = Math.abs((currentAsp + nextAsp) - targetGridAspect);
                   if (currentAsp >= targetGridAspect || distNext >= distNow) break;
                   currentAsp += nextAsp;
                   neededBodyForHeader++;
                   bIdx++;
               }
           } else {
               const nextAsp = simItems[i + 1];
               const distNow = Math.abs(currentAsp - targetGridAspect);
               const distNext = Math.abs((currentAsp + nextAsp) - targetGridAspect);
               if (currentAsp >= targetGridAspect || distNext >= distNow) currentAsp = 0;
           }
       }
    }

    let balancedBody: any[] = [];
    if (sections.header.length === 0 && bodyItems.length > 0) {
      const gridItems = [
        ...bodyItems.slice(0, optimalCols),
        ...profile.map(i => ({ ...i, section: 'profile' as SectionKey, gridCols: optimalCols })),
        ...bodyItems.slice(optimalCols)
      ];
      const fillerSrc = midSkins.length > 0 ? midSkins.map(i => ({ ...i, section: 'midSkins' as SectionKey, cellType: 'skin' as const, gridCols: optimalCols })) : gridItems;
      balancedBody = balance(gridItems, optimalCols, fillerSrc);
    } else {
      const firstRowFitsInHeader = bodyItems.slice(0, neededBodyForHeader);
      const gridItems = [
        ...profile.map(i => ({ ...i, section: 'profile' as SectionKey, gridCols: optimalCols })),
        ...bodyItems.slice(neededBodyForHeader)
      ];
      const fillerSrc = midSkins.length > 0 ? midSkins.map(i => ({ ...i, section: 'midSkins' as SectionKey, cellType: 'skin' as const, gridCols: optimalCols })) : gridItems;
      balancedBody = [
        ...firstRowFitsInHeader,
        ...balance(gridItems, optimalCols, fillerSrc)
      ];
    }
    const bFooter = balance(footer, optimalCols, footer);

    // Re-build final list using the balanced body sequence
    const finalVAll: (ImageData & { section: SectionKey; gridCols: number })[] = [
      ...finalHeader.map(i => ({ ...i, section: 'header' as SectionKey, gridCols: 0 })),
      ...balancedBody.map(i => ({ ...itemScale(i), section: (i as any).section, cellType: (i as any).cellType, gridCols: optimalCols })),
      ...bFooter.map(i => ({ ...itemScale(i), section: 'footer' as SectionKey, cellType: 'footer' as const, gridCols: optimalCols }))
    ].filter(i => i.imgElement);

    // Grid layout is now handled by mustBreak logic per section

    // Helper for minor properties
    function itemScale(i: ImageData) { return i; }

    const rows: { items: any[], h: number, gaps: number[], isFull: boolean }[] = [];
    let currentItems: any[] = [];
    let currentAspect = 0;
    let itemsProcessed = 0;

    for (let i = 0; i < finalVAll.length; i++) {
      const item = finalVAll[i];
      const img = item.imgElement!;
      const asp = img.naturalWidth / img.naturalHeight;

      currentItems.push({ ...item, aspect: asp });
      currentAspect += asp;
      itemsProcessed++;

      const isLastOfAll = itemsProcessed === finalVAll.length;
      const nextItem = finalVAll[i + 1];
      const nextSection = nextItem ? nextItem.section : null;
      const isGrid = item.gridCols > 0;
      const rowStartedAsGrid = currentItems.length > 0 ? currentItems[0].gridCols > 0 : isGrid;
      
      // Allow Header and Body items to share rows seamlessly, only break naturally or if footer
      const mustBreak = nextItem && (
        (item.section === 'footer' || nextSection === 'footer' ? item.section !== nextSection : false) ||
        (rowStartedAsGrid && currentItems.length >= item.gridCols)
      );

      // Advanced breaking logic for justified rows (header/profile)
      let shouldBreakNaturally = false;
      if (!isLastOfAll && !mustBreak && !rowStartedAsGrid) {
        const nextAsp = getAsp(nextItem ? nextItem.imgElement : null);
        const targetGridAspect = optimalCols * avgSkinAsp;
        const distNow = Math.abs(currentAspect - targetGridAspect);
        const distNext = Math.abs((currentAspect + nextAsp) - targetGridAspect);
        if (currentAspect >= targetGridAspect || distNext >= distNow) {
          shouldBreakNaturally = true;
        }
      }

      if (isLastOfAll || mustBreak || shouldBreakNaturally) {
        const gaps: number[] = [];
        let rowTotalGap = 0;
        for (let j = 0; j < currentItems.length; j++) {
          let g = 0;
          if (j > 0) {
            const prev = currentItems[j - 1];
            const curr = currentItems[j];
            if ((prev.cellType === 'skin' || prev.cellType === 'footer') &&
              (curr.cellType === 'skin' || curr.cellType === 'footer')) {
              g = 0;
            } else {
              g = innerPad;
            }
          }
          gaps.push(g);
          rowTotalGap += g;
        }

        let rh = (contentW - rowTotalGap) / currentAspect;
        let isFullWidth = true;

        const isGridRow = currentItems.length > 0 && currentItems[0].gridCols > 0;
        const isHeader = currentItems.length > 0 && currentItems[0].section === 'header';
        const expectedGridH = (contentW - (optimalCols - 1) * innerPad) / (optimalCols * avgSkinAsp);

        if (isHeader) {
          // Bắt buộc chiều cao bằng các hàng Phần Giữa và full viền
          rh = expectedGridH;
          isFullWidth = true;
          
          const targetTotalAspect = (contentW - rowTotalGap) / rh;
          const aspectMultiplier = targetTotalAspect / currentAspect;
          
          currentItems.forEach(it => {
            it.aspect *= aspectMultiplier; // Tỷ lệ chia đều chuẩn xác toán học, giao lại ranh giới crop cho Cover
          });
        } else if ((isGridRow || isLastOfAll) && rh > baseTargetH * 1.8) {
          // Safeguard for extreme cases
          rh = baseTargetH;
          isFullWidth = false;
        }

        rows.push({ items: currentItems, h: rh, gaps, isFull: isFullWidth });
        currentItems = [];
        currentAspect = 0;
      }
    }


    // Per-section balancing now handles trailing rows more precisely

    let totalH = pad * 2;
    rows.forEach((row, i) => {
      totalH += row.h;
      if (i < rows.length - 1) totalH += rowGap;
    });

    const MAX_CANVAS_DIM = 16000;
    let scaleF = 1;
    if (totalH > MAX_CANVAS_DIM || W > MAX_CANVAS_DIM) {
      scaleF = Math.min(MAX_CANVAS_DIM / totalH, MAX_CANVAS_DIM / W);
    }

    canvas.width = Math.ceil(W * scaleF);
    canvas.height = Math.ceil(totalH * scaleF);

    ctx.fillStyle = bgc;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scaleF, scaleF);

    if (borderWidth > 0) {
      ctx.lineWidth = borderWidth;
      if (borderStyle === 'solid') ctx.strokeStyle = borderColor;
      else {
        const g = ctx.createLinearGradient(0, 0, W, totalH);
        g.addColorStop(0, '#ff0cfa'); g.addColorStop(1, '#00f6ff');
        ctx.strokeStyle = g;
      }
      ctx.beginPath();
      roundRectPath(ctx, borderWidth / 2, borderWidth / 2, W - borderWidth, totalH - borderWidth, rad);
      ctx.stroke();
    }

    let currentY = pad;
    rows.forEach((row) => {
      let currentX = pad;
      const rh = row.h;

      if (!row.isFull) {
        const rowW = row.items.reduce((sum, it, idx) => sum + it.aspect * rh + row.gaps[idx], 0);
        currentX = pad + (contentW - rowW) / 2;
      }

      let skinGroup: { x: number, w: number } | null = null;

      for (let i = 0; i < row.items.length; i++) {
        const item = row.items[i];
        const gapBefore = row.gaps[i];
        currentX += gapBefore;

        const itemW = item.aspect * rh;
        const isHeader = item.section === 'header';
        const isProfile = item.section === 'profile';
        const isSkinLike = item.cellType === 'skin' || item.cellType === 'footer';

        // Header/Profile usually have individual borders, but if it's a "skinlike" filler, skip individual border
        const individualBorder = ((isHeader && !isSkinLike) || isProfile || item.cellType === 'wheel') ? 1 : 0;
        const bCol = (isHeader || isProfile) ? '#ffffff' : borderColor;

        const pX = (item.cellType === 'vip' || item.cellType === 'wheel') ? 4 : 0;
        const pY = pX;

        const drawX = Math.round(currentX + pX);
        const drawY = Math.round(currentY + pY);
        const drawW = Math.round(itemW - pX * 2);
        const drawH = Math.round(rh - pY * 2);

        let itemFit: string = fit;
        if (item.cellType === 'vip' || item.cellType === 'wheel') itemFit = 'contain';
        else if (item.cellType === 'footer' || item.cellType === 'skin') itemFit = 'stretch';
        else if (isHeader || isProfile) itemFit = 'cover';

        drawItem(ctx, item.imgElement, drawX, drawY, drawW, drawH, rad, itemFit, individualBorder, bCol);

        if (item.cellType === 'skin' || item.cellType === 'footer') {
          if (!skinGroup) {
            skinGroup = { x: currentX, w: itemW };
          } else {
            skinGroup.w += itemW + gapBefore;
          }
        } else {
          if (skinGroup) {
            drawGroupBorder(ctx, skinGroup.x, currentY, skinGroup.w, rh, rad, '#ffffff');
            skinGroup = null;
          }
        }

        currentX += itemW;
      }

      const finalSG = skinGroup;
      if (finalSG) {
        drawGroupBorder(ctx, finalSG.x, currentY, finalSG.w, rh, rad, '#ffffff');
      }

      currentY += rh + rowGap;
    });

    ctx.restore();
    setHasRendered(true);
  };

  const drawGroupBorder = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  };

  const drawItem = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, r: number, drawFit: string, borderW: number = 0, borderColor: string = '') => {
    if (!img) return;
    ctx.save();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();

    const iw = img.naturalWidth, ih = img.naturalHeight;
    let sc, dw, dh;

    if (drawFit === 'stretch') {
      ctx.drawImage(img, x, y, w, h);
    } else if (drawFit === 'contain') {
      sc = Math.min(w / iw, h / ih);
      dw = iw * sc; dh = ih * sc;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else if (drawFit === 'original') {
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    } else {
      sc = Math.max(w / iw, h / ih);
      dw = iw * sc; dh = ih * sc;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
    ctx.restore();

    if (borderW > 0) {
      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderW;
      ctx.beginPath();
      roundRectPath(ctx, x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
    }

    if (showDim) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y + h - 20, w, 20);
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${iw}x${ih}`, x + w / 2, y + h - 7);
    }
  };

  const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `ghep-anh-lien-quan-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const DropZoneSection = ({ sKey, label, sub }: { sKey: SectionKey, label: string, sub: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="section-box">
        <label className="section-label">{label}</label>
        <input
          type="file"
          ref={inputRef}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, sKey)}
        />
        <div
          className={`dropzone dz-mini ${isDragOver === sKey ? 'over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(sKey); }}
          onDragLeave={() => setIsDragOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(null);
            if (e.dataTransfer.files) processFiles(e.dataTransfer.files, sKey);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="ico"><Layers size={20} /></div>
          <p>{label}</p>
          <p className="dz-sub">{sub}</p>
        </div>

        {sections[sKey].length > 0 && (
          <div className="thumbs">
            {sections[sKey].map((img, i) => (
              <div
                key={img.id}
                className="th"
                style={(sKey === 'header' || sKey === 'profile') ? { border: '1px solid #ffffff' } : {}}
              >
                <img src={img.src} alt="" />
                <span className="th-n">{i + 1}</span>
                <div className="th-x" onClick={() => handleRemoveImage(sKey, i)}>×</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        {onLogout && <button className="logout-btn" onClick={onLogout}>Đăng xuất</button>}
      </header>

      <div className="wrap">
        <div className="sections-grid">
          <DropZoneSection sKey="header" label="1. Phần Đầu (Chữ nhật ngang)" sub="Kéo thả ảnh phần đầu vào đây" />
          <DropZoneSection sKey="profile" label="1.1 Profile (Đầu hàng 2)" sub="Kéo thả ảnh profile vào đây" />

          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#ffeb3b', textTransform: 'uppercase' }}>2. Phần Giữa</h3>
            <DropZoneSection sKey="midVIP" label="2.1 Ảnh KHÔNG viền" sub="Phù hợp: Bảng Rank Lớn, Avatar... (Cách rời)" />
            {/* <DropZoneSection sKey="midWheel" label="2.2 Ảnh CỐ viền rời" sub="Phù hợp: Các vòng quay nhỏ... (Viền lẻ)" /> */}
            <DropZoneSection sKey="midSkins" label="2.2 Nhóm ảnh viền chung" sub="Phù hợp: Tướng đặt sát nhau cuối hàng" />
          </div>

          <DropZoneSection sKey="footer" label="3. Phần Cuối (Lưới 21 cột)" sub="Kéo thả ảnh phần cuối vào đây" />
        </div>

        <div className="opts-group">
          <div className="opts-title">THÔNG SỐ CANVAS TỔNG THỂ</div>
          <div className="opts-row">
            <div className="cg">
              <label>Kích thước</label>
              <select onChange={e => {
                const val = e.target.value;
                if (!val) return;
                const [w, h] = val.split('x').map(Number);
                setCanvasW(w);
                setCanvasH(h);
              }}>
                <option value="1920x1080">Full HD (1920x1080)</option>
                <option value="2560x1440">2K (2560x1440)</option>
                <option value="3840x2160">4K (3840x2160)</option>
                <option value="1080x1920">Mobile (1080x1920)</option>
              </select>
            </div>
            <div className="cg"><label>W</label><input type="number" value={canvasW} onChange={e => setCanvasW(Number(e.target.value) || 1920)} /></div>
            <div className="cg"><label>H</label><input type="number" value={canvasH} onChange={e => setCanvasH(Number(e.target.value) || 1080)} /></div>
            <div className="cg"><label>Thưa giữa các Phần</label><input type="number" value={gap} min={0} max={100} onChange={e => setGap(Number(e.target.value) || 0)} /></div>
            <div className="cg"><label>Bo góc chung (px)</label><input type="number" value={rad} min={0} max={100} onChange={e => setRad(Number(e.target.value) || 0)} /></div>
            <div className="cg"><label>Viền mép ngoài ảnh</label><input type="number" value={pad} min={0} max={100} onChange={e => setPad(Number(e.target.value) || 0)} /></div>
            <div className="cg"><label>Màu nền</label><input type="color" value={bgc} onChange={e => setBgc(e.target.value)} /></div>
            <div className="cg"><label>Kiểu viền tổng</label>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value as any)}>
                <option value="solid">Màu đơn sắc</option>
                <option value="gradient1">Gradient (Hồng - Xanh)</option>
              </select>
            </div>
            {borderStyle === 'solid' && (
              <div className="cg"><label>Màu viền đơn</label><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} /></div>
            )}
            <div className="cg"><label>Độ dày viền (px)</label><input type="number" value={borderWidth} min={0} max={200} onChange={e => setBorderWidth(Number(e.target.value) || 0)} /></div>
            <div className="cg"><label>Hiển thị ảnh</label>
              <select value={fit} onChange={e => setFit(e.target.value as any)}>
                <option value="cover">Cắt tỉ lệ (Cover)</option>
                <option value="contain">Nguyên gốc (Contain)</option>
                <option value="stretch">Kéo giãn (Stretch)</option>
                <option value="original">Kích thước thật (Original)</option>
              </select>
            </div>
            <div className="cg">
              <label>Hiện chữ</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aeb5cc', cursor: 'pointer', fontWeight: 'normal', height: '32px' }}>
                <input type="checkbox" checked={showDim} onChange={e => setShowDim(e.target.checked)} style={{ width: 'auto', margin: 0, cursor: 'pointer' }} />
                Hiện WxH
              </label>
            </div>
          </div>
        </div>



        <div className="btns">
          <button className="b-go" onClick={renderCanvas}>
            <RefreshCw size={16} /> Bắt đầu Ghép
          </button>
          <button className="b-dl" onClick={downloadImage} disabled={!hasRendered}>
            <Download size={16} /> Tải về máy
          </button>
          <button className="b-cl" onClick={clearAll}>
            <Trash2 size={16} /> Xóa sạch
          </button>
        </div>

        <div className="prev">
          <h3>Xem trước Kết quả (Max Resolution)</h3>
          {!hasRendered && <p className="ph">Thêm ảnh rồi nhấn "Bắt đầu Ghép" để xem kết quả siêu nét nhé!</p>}
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} style={{ display: hasRendered ? 'block' : 'none', boxShadow: '0 0 40px rgba(0, 240, 255, 0.12)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
