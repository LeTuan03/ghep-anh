import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Trash2, Download, RefreshCw, Layers } from 'lucide-react';
import '../App.css';

interface ImageData {
  id: string;
  src: string;
  file: File;
  imgElement: HTMLImageElement | null;
  cellType?: 'vip' | 'wheel' | 'skin';
}

type SectionKey = 'header' | 'midVIP' | 'midWheel' | 'midSkins' | 'middle' | 'footer';

export default function Home({ onLogout }: { onLogout?: () => void }) {
  const [sections, setSections] = useState<Record<SectionKey, ImageData[]>>({
    header: [],
    midVIP: [],
    midWheel: [],
    midSkins: [],
    middle: [],
    footer: []
  });
  
  // Settings layout khít 100% bề ngang
  const [canvasW, setCanvasW] = useState(1920);
  
  const [gap, setGap] = useState(0);
  const [rad, setRad] = useState(0);
  const [bgc, setBgc] = useState('#0b1426'); // Xanh đậm của nền game Liên Quân
  const [pad, setPad] = useState(5);
  const [fit, setFit] = useState<'cover' | 'contain' | 'stretch' | 'original'>('cover');
  const [borderColor, setBorderColor] = useState('#373a68'); // Viền xanh xám
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
    setSections({ header: [], midVIP: [], midWheel: [], midSkins: [], middle: [], footer: [] });
    setHasRendered(false);
  };

  const renderCanvas = () => {
    const { header, midVIP, midWheel, midSkins, middle, footer } = sections;
    
    if (header.length === 0 && middle.length === 0 && footer.length === 0 && midVIP.length === 0 && midWheel.length === 0 && midSkins.length === 0) {
      alert('Vui lòng thêm ít nhất 1 ảnh!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === TÍNH TOÁN CÁC BỤC === //
    const w = canvasW;

    const computeSection = (sectionItems: ImageData[], cols: number, ratio: number, aw: number, colGap: number, rowGap: number) => {
      const rows = Math.ceil(sectionItems.length / cols);
      let blockH = 0;
      const rowHeights: number[] = [];
      const currentItemW = (aw - colGap * (cols - 1)) / cols;
      
      for (let r = 0; r < rows; r++) {
        let rowH = 0;
        if (ratio > 0) {
          rowH = currentItemW * ratio;
        } else {
           for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              if (idx < sectionItems.length && sectionItems[idx].imgElement) {
                 const img = sectionItems[idx].imgElement!;
                 let h = currentItemW * (img.naturalHeight / img.naturalWidth);
                 if (isNaN(h) || h <= 0) h = currentItemW;
                 if (h > rowH) rowH = h;
              }
           }
           if (rowH === 0) rowH = currentItemW;
        }
        rowHeights.push(rowH);
        blockH += rowH;
      }
      if (rows > 0) blockH += (rows - 1) * rowGap;
      return { rows, rowHeights, blockH, cols, itemW: currentItemW };
    };

    const getBestCols = (len: number, target: number) => {
      if (len <= 0) return target;
      if (len <= target) return len;
      
      let bestCols = target;
      let minEmptySlots = Infinity;
      let minDiffFromTarget = Infinity;
      
      // Tìm trong khoảng từ target-5 đến target+3 để tìm số cột "đẹp" nhất
      const minC = Math.max(1, target - 5);
      const maxC = target + 5;
      
      for (let i = minC; i <= maxC; i++) {
        const remainder = len % i;
        const emptySlots = remainder === 0 ? 0 : (i - remainder);
        const diffFromTarget = Math.abs(i - target);
        
        // Ưu tiên 1: Ít ô trống nhất ở hàng cuối
        // Ưu tiên 2: Gần với con số target nhất
        if (emptySlots < minEmptySlots || (emptySlots === minEmptySlots && diffFromTarget < minDiffFromTarget)) {
          minEmptySlots = emptySlots;
          minDiffFromTarget = diffFromTarget;
          bestCols = i;
        }
        
        // Nếu tìm được số chia hết (0 ô trống) và khá gần target (diff <= 3) thì chốt luôn
        if (emptySlots === 0 && diffFromTarget <= 3) {
          return i;
        }
      }
      
      return bestCols;
    };


    // TÍNH TOÁN CÁC BỤC VỚI ẢNH HỢP LỆ
    const getValidItems = (items: ImageData[]) => items.filter(i => i.imgElement);
    
    const vHeader = getValidItems(header);
    const vMidMerged = getValidItems([
      ...midVIP.map(i => ({ ...i, cellType: 'vip' as const })),
      ...midWheel.map(i => ({ ...i, cellType: 'wheel' as const })),
      ...midSkins.map(i => ({ ...i, cellType: 'skin' as const })),
      ...middle.map(i => ({ ...i, cellType: 'vip' as const }))
    ]);
    const vFooter = getValidItems(footer).map(i => ({ ...i, cellType: 'skin' as const }));

    const headC = getBestCols(vHeader.length, 14);


    const headPad = 5;
    const awHead = w - pad * 2 - headPad * 2;
    const headLayout = computeSection(vHeader, headC, 0, awHead, 8, 8);

    const midC = getBestCols(vMidMerged.length, 21);
    const midPad = 5;
    const awMid = w - pad * 2 - midPad * 2;
    const midLayout = computeSection(vMidMerged, midC, 0, awMid, 0, 8);

    const footC = getBestCols(vFooter.length, 21);
    const footLayout = computeSection(vFooter, footC, 0, awMid, 0, 8);

    // TÍNH TỔNG CHIỀU CAO CANVAS CHÍNH XÁC
    let totalH = pad * 2; 
    const drawPlan: { items: ImageData[], layout: any, p: number }[] = [];
    
    if (vHeader.length > 0) drawPlan.push({ items: vHeader, layout: headLayout, p: headPad });
    if (vMidMerged.length > 0) drawPlan.push({ items: vMidMerged, layout: midLayout, p: midPad });
    if (vFooter.length > 0) drawPlan.push({ items: vFooter, layout: footLayout, p: midPad });

    drawPlan.forEach((sec, idx) => {
      totalH += sec.layout.blockH + sec.p * 2;
      if (idx < drawPlan.length - 1) totalH += gap;
    });



    // === AUTO SCALE LIMIT PROTECTION TO PREVENT BROWSER OOM CATASTROPHES ===
    const MAX_CANVAS_DIM = 16000;
    let scaleF = 1;
    if (totalH > MAX_CANVAS_DIM || w > MAX_CANVAS_DIM) {
      scaleF = Math.min(MAX_CANVAS_DIM / Math.max(1, totalH), MAX_CANVAS_DIM / Math.max(1, w));
    }

    const finalW = Math.max(1, Math.ceil(w * scaleF));
    const finalH = Math.max(1, Math.ceil(totalH * scaleF));

    // UPDATE CANVAS SIZE
    canvas.width = finalW;
    canvas.height = finalH;

    // FILL NỀN
    ctx.fillStyle = bgc;
    ctx.fillRect(0, 0, finalW, finalH);

    ctx.save();
    if (scaleF !== 1) {
      ctx.scale(scaleF, scaleF);
    }

    // KẺ VIỀN CANVAS TO
    if (borderWidth > 0) {
      if (borderStyle === 'solid') {
        ctx.strokeStyle = borderColor;
      } else if (borderStyle === 'gradient1') {
        const grad = ctx.createLinearGradient(0, 0, w, totalH);
        grad.addColorStop(0, '#ff0cfa'); // Pink/Magenta
        grad.addColorStop(1, '#00f6ff'); // Cyan
        ctx.strokeStyle = grad;
      }
      
      const bw = borderWidth;
      ctx.lineWidth = bw;
      
      ctx.beginPath();
      roundRectPath(ctx, bw / 2, bw / 2, w - bw, totalH - bw, rad);
      ctx.stroke();
    }

    let currentY = pad;
    
    // VẼ CÁC PHẦN THEO KẾ HOẠCH
    drawPlan.forEach((plan, idx) => {
       const isHeader = idx === 0 && plan.items === vHeader;
       const colGap = isHeader ? 8 : 0;
       const rowGap = 8;
       const brColor = isHeader ? 'rgba(255, 255, 255)' : '#ffffff';
       
       // my bắt đầu vẽ ở trong section
       let my = currentY + plan.p;
       const cW = plan.layout.itemW;

       for (let r = 0; r < plan.layout.rows; r++) {
          const rh = plan.layout.rowHeights[r];
          const actualItemsInRow = Math.min(plan.layout.cols, plan.items.length - r * plan.layout.cols);
          if (actualItemsInRow <= 0) break;

          // -- LOGIC JUSTIFY: Nếu hàng cuối gần đầy, cho nó dãn ra khít 100% --
          const isLastRow = r === plan.layout.rows - 1;
          const needsJustify = isLastRow && actualItemsInRow < plan.layout.cols && actualItemsInRow > plan.layout.cols * 0.7;
          
          let cW_row = cW;
          if (needsJustify) {
             cW_row = (awMid + (isHeader ? (awHead - awMid) : 0) - colGap * (actualItemsInRow - 1)) / actualItemsInRow;
          }

          let skinGroupStartX = -1;
          let skinGroupEndX = -1;

          for (let c = 0; c < actualItemsInRow; c++) {
             const idxItem = r * plan.layout.cols + c;
             if (idxItem < plan.items.length) {
                const item = plan.items[idxItem];
                const padX = (item.cellType === 'vip' || item.cellType === 'wheel') ? 4 : 0;
                const padY = 0;
                const individualBorder = (isHeader || item.cellType === 'wheel') ? 1 : 0;
                const borderCol = isHeader ? '#ffffff' : borderColor;

                const startX = pad + plan.p + c * (cW_row + colGap);
                const startY = my;
                
                const x = Math.round(startX) + padX;
                const y = Math.round(startY) + padY;
                const w = Math.round(startX + cW_row) - Math.round(startX) - padX*2;
                const h = Math.round(my + rh) - Math.round(my) - padY*2;

                const itemFit = (item.cellType === 'vip' || item.cellType === 'wheel') ? 'contain' : 'stretch';
                drawItem(ctx, item.imgElement, x, y, w, h, rad, itemFit, individualBorder, borderCol);



                if (item.cellType === 'skin') {
                   if (skinGroupStartX === -1) skinGroupStartX = startX;
                   skinGroupEndX = startX + cW_row;
                }
             }
          }


          if (skinGroupStartX !== -1) {
            const rowX = Math.round(skinGroupStartX);
            const rowY = Math.round(my);
            const rowW = Math.round(skinGroupEndX) - rowX;
            const rowH = Math.round(my + rh) - rowY;

            ctx.save();
            ctx.beginPath();
            const rowBorderW = 1;
            const bHalf = rowBorderW / 2;
            const br = rad + bHalf;
            roundRectPath(ctx, rowX - bHalf, rowY - bHalf, rowW + rowBorderW, rowH + rowBorderW, br);
            ctx.lineWidth = rowBorderW;
            ctx.strokeStyle = brColor;
            ctx.stroke();
            ctx.restore();
          }

          my += rh + rowGap;
       }
       
       // Cập nhật currentY cho section tiếp theo
       currentY += plan.layout.blockH + plan.p * 2;
       if (idx < drawPlan.length - 1) currentY += gap;
    });


    ctx.restore(); // Restore limits

    setHasRendered(true);
  };

  const drawItem = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, r: number, drawFit: string, borderW: number = 0, borderColor: string = '') => {
    if (!img) return;
    ctx.save();
    
    roundRectPath(ctx, x, y, w, h, r);
    ctx.clip();

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    let sc, dw, dh;

    // Scale
    if (drawFit === 'stretch') {
      ctx.drawImage(img, x, y, w, h);
    } else if (drawFit === 'contain') {
      sc = Math.min(w / iw, h / ih);
      dw = iw * sc; dh = ih * sc;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else if (drawFit === 'original') {
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    } else {
      // cover
      sc = Math.max(w / iw, h / ih);
      dw = iw * sc; dh = ih * sc;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
    
    ctx.restore();

    if (borderW > 0) {
      const bHalf = borderW / 2;
      ctx.save();
      ctx.beginPath();
      // Viền bọc ngoài
      const br = r + bHalf;
      roundRectPath(ctx, x - bHalf, y - bHalf, w + borderW, h + borderW, br);
      ctx.lineWidth = borderW;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
      ctx.restore();
    }

    if (showDim) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y + h - 24, w, 24);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${iw} × ${ih}`, x + w / 2, y + h - 12);
    }
  };

  const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
                style={sKey === 'header' ? { border: '1px solid #ffffff' } : {}}
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
            <div className="cg"><label>Chiều Rộng (px)</label><input type="number" value={canvasW} min={400} max={8000} onChange={e => setCanvasW(Number(e.target.value) || 1920)}/></div>
            <div className="cg"><label>Thưa giữa các Phần</label><input type="number" value={gap} min={0} max={100} onChange={e => setGap(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Bo góc chung (px)</label><input type="number" value={rad} min={0} max={100} onChange={e => setRad(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Viền mép ngoài ảnh</label><input type="number" value={pad} min={0} max={100} onChange={e => setPad(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Màu nền</label><input type="color" value={bgc} onChange={e => setBgc(e.target.value)}/></div>
            <div className="cg"><label>Kiểu viền tổng</label>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value as any)}>
                <option value="solid">Màu đơn sắc</option>
                <option value="gradient1">Gradient (Hồng - Xanh)</option>
              </select>
            </div>
            {borderStyle === 'solid' && (
              <div className="cg"><label>Màu viền đơn</label><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}/></div>
            )}
            <div className="cg"><label>Độ dày viền (px)</label><input type="number" value={borderWidth} min={0} max={200} onChange={e => setBorderWidth(Number(e.target.value) || 0)}/></div>
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
