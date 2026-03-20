import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Trash2, Download, RefreshCw, Layers } from 'lucide-react';
import '../App.css';

interface ImageData {
  id: string;
  src: string;
  file: File;
  imgElement: HTMLImageElement | null;
}

type SectionKey = 'header' | 'middle' | 'footer';

export default function Home({ onLogout }: { onLogout?: () => void }) {
  const [sections, setSections] = useState<Record<SectionKey, ImageData[]>>({
    header: [],
    middle: [],
    footer: []
  });
  
  // Settings layout khít 100% bề ngang
  const [canvasW, setCanvasW] = useState(1920);
  
  const [headCols, setHeadCols] = useState(1);
  const [headRatio, setHeadRatio] = useState(0); // 0 = Auto
  
  const [midCols, setMidCols] = useState(1);
  const [midRatio, setMidRatio] = useState(0); // 0 = Auto
  
  const [footCols, setFootCols] = useState(1);
  const [footRatio, setFootRatio] = useState(0); // 0 = Auto
  
  const [gap, setGap] = useState(0);
  const [rad, setRad] = useState(0);
  const [bgc, setBgc] = useState('#0b1426'); // Xanh đậm của nền game Liên Quân
  const [pad, setPad] = useState(0);
  const [fit, setFit] = useState<'cover' | 'contain' | 'stretch' | 'original'>('cover');
  const [borderColor, setBorderColor] = useState('#224c8a'); // Viền xanh xám
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
    setSections({ header: [], middle: [], footer: [] });
    setHasRendered(false);
  };

  const renderCanvas = () => {
    const { header, middle, footer } = sections;
    if (header.length === 0 && middle.length === 0 && footer.length === 0) {
      alert('Vui lòng thêm ít nhất 1 ảnh!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === TÍNH TOÁN CÁC BỤC === //
    const w = canvasW;
    const aw = w - pad * 2; // Vùng khả dụng chiều ngang sau khi trừ pad

    const computeSection = (sectionItems: ImageData[], cols: number, ratio: number, itemW: number) => {
      const rows = Math.ceil(sectionItems.length / cols);
      let blockH = 0;
      const rowHeights: number[] = [];
      for (let r = 0; r < rows; r++) {
        let rowH = 0;
        if (ratio > 0) {
          rowH = itemW * ratio;
        } else {
           for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              if (idx < sectionItems.length && sectionItems[idx].imgElement) {
                 const img = sectionItems[idx].imgElement!;
                 const h = itemW * (img.naturalHeight / img.naturalWidth);
                 if (h > rowH) rowH = h;
              }
           }
           if (rowH === 0) rowH = itemW;
        }
        rowHeights.push(rowH);
        blockH += rowH;
      }
      if (rows > 0) blockH += (rows - 1) * gap;
      return { rows, rowHeights, blockH, cols };
    };

    const headC = Math.max(1, headCols);
    const hw = (aw - gap * (headC - 1)) / headC;
    const headLayout = computeSection(header, headC, headRatio, hw);

    const midC = Math.max(1, midCols);
    const mw = (aw - gap * (midC - 1)) / midC;
    const midLayout = computeSection(middle, midC, midRatio, mw);

    const footC = Math.max(1, footCols);
    const fw = (aw - gap * (footC - 1)) / footC;
    const footLayout = computeSection(footer, footC, footRatio, fw);

    // TÍNH TỔNG CHIỀU CAO CANVAS
    let totalH = pad * 2;
    if (headLayout.blockH > 0) totalH += headLayout.blockH;
    if (midLayout.blockH > 0) {
      if (headLayout.blockH > 0) totalH += gap;
      totalH += midLayout.blockH;
    }
    if (footLayout.blockH > 0) {
      if (headLayout.blockH > 0 || midLayout.blockH > 0) totalH += gap;
      totalH += footLayout.blockH;
    }

    // UPDATE CANVAS SIZE
    canvas.width = w;
    canvas.height = totalH;

    // FILL NỀN
    ctx.fillStyle = bgc;
    ctx.fillRect(0, 0, w, totalH);

    // KẺ VIỀN CANVAS TO
    ctx.strokeStyle = borderColor; 
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, totalH - 4);

    let currentY = pad;

    const drawGrid = (items: ImageData[], layout: {rows: number, rowHeights: number[], cols: number, blockH: number}, cW: number, ratio: number) => {
      let my = currentY;
      for (let r = 0; r < layout.rows; r++) {
        const rh = layout.rowHeights[r];
        for (let c = 0; c < layout.cols; c++) {
           const idx = r * layout.cols + c;
           if (idx < items.length) {
              const x = pad + c * (cW + gap);
              const y = my;
              drawItem(ctx, items[idx].imgElement, x, y, cW, rh, rad, ratio === 0 ? 'stretch' : fit);
           }
        }
        my += rh + gap;
      }
      currentY += layout.blockH + gap;
    };

    if (header.length > 0) drawGrid(header, headLayout, hw, headRatio);
    if (middle.length > 0) drawGrid(middle, midLayout, mw, midRatio);
    if (footer.length > 0) drawGrid(footer, footLayout, fw, footRatio);

    setHasRendered(true);
  };

  const drawItem = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, r: number, drawFit: string) => {
    if (!img) return;
    ctx.save();
    
    // Viền item: vàng đất chìm
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    
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
    
    // Nét bo góc
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, r);
    ctx.stroke();

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
              <div key={img.id} className="th">
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
        <h1>Trình Ghép Ảnh Siêu Cấp</h1>
        <p>Tự động căng khít Layout (Đầu 10 cột, Cuối 21 cột như thẻ Liên Quân) — Tuỳ chỉnh hoàn toàn!</p>
        <div style={{color:'var(--pink)', fontSize:'0.8rem', marginTop:'8px'}}>Kéo thả ảnh vào từng phần, Cột và Tỉ lệ sẽ TỰ ĐỘNG co giãn khớp 100% với khung Viền!</div>
        {onLogout && <button className="logout-btn" onClick={onLogout}>Đăng xuất</button>}
      </header>
      
      <div className="wrap">
        <div className="sections-grid">
          <DropZoneSection sKey="header" label="1. Phần Đầu (Chữ nhật ngang)" sub="Sẽ dàn theo tỷ lệ ngang (Ví dụ: 10 cột, 3 hàng)" />
          <DropZoneSection sKey="middle" label="2. Phần Giữa (Thông tin Khác)" sub="Ảnh to nguyên ngang / Hoặc lưới Auto height" />
          <DropZoneSection sKey="footer" label="3. Phần Cuối (Chữ nhật dọc)" sub="Dàn mỏng dày đặc tỉ lệ dọc (Ví dụ: 21 cột tướng)" />
        </div>

        <div className="opts-group">
          <div className="opts-title">⚙️ THÔNG SỐ CANVAS TỔNG THỂ</div>
          <div className="opts-row">
            <div className="cg"><label>Chiều Rộng (px)</label><input type="number" value={canvasW} min={400} max={8000} onChange={e => setCanvasW(Number(e.target.value) || 1920)}/></div>
            <div className="cg"><label>Khoảng cách ô</label><input type="number" value={gap} min={0} max={100} onChange={e => setGap(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Bo góc (px)</label><input type="number" value={rad} min={0} max={100} onChange={e => setRad(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Padding lề</label><input type="number" value={pad} min={0} max={100} onChange={e => setPad(Number(e.target.value) || 0)}/></div>
            <div className="cg"><label>Màu nền</label><input type="color" value={bgc} onChange={e => setBgc(e.target.value)}/></div>
            <div className="cg"><label>Màu viền tổng</label><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}/></div>
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

        <div className="opts-group">
          <div className="opts-title">📊 CHI TIẾT CÁC PHẦN (TỰ ĐỘNG CHIA RỘNG THEO CANVAS)</div>
          <div className="opts-row split-3">
            <div className="opts-col">
              <h4>1. Phần Đầu (Trên)</h4>
              <div className="cg"><label>Số Cột</label><input type="number" value={headCols} min={1} max={50} onChange={e => setHeadCols(Number(e.target.value) || 1)}/></div>
              <div className="cg"><label>Tỷ lệ H / W (0 = Auto)</label><input type="number" step="0.05" value={headRatio} onChange={e => setHeadRatio(Number(e.target.value))}/>
                <small style={{color:'var(--cyan)', fontSize:'10px', marginTop:'4px'}}>+ Chọn 0 để tự động fit ngang</small>
              </div>
            </div>
            
            <div className="opts-col">
              <h4>2. Phần Giữa (Info)</h4>
              <div className="cg"><label>Số Cột</label><input type="number" value={midCols} min={1} max={50} onChange={e => setMidCols(Number(e.target.value) || 1)}/></div>
              <div className="cg"><label>Tỷ lệ H / W (0 = Auto)</label><input type="number" step="0.05" value={midRatio} onChange={e => setMidRatio(Number(e.target.value))}/>
                 <small style={{color:'var(--sub)', fontSize:'10px', marginTop:'4px'}}>+ Chọn 0 để tự động fit ngang</small>
              </div>
            </div>
            
            <div className="opts-col">
              <h4>3. Phần Cuối (Dưới)</h4>
              <div className="cg"><label>Số Cột</label><input type="number" value={footCols} min={1} max={50} onChange={e => setFootCols(Number(e.target.value) || 1)}/></div>
              <div className="cg"><label>Tỷ lệ H / W (0 = Auto)</label><input type="number" step="0.05" value={footRatio} onChange={e => setFootRatio(Number(e.target.value))}/>
                <small style={{color:'var(--pink)', fontSize:'10px', marginTop:'4px'}}>+ Chọn 0 để tự động fit ngang</small>
              </div>
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
