import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Image as ImageIcon, Trash2, Download, PlusCircle, RefreshCw } from 'lucide-react';
import './App.css';

interface ImageData {
  id: string;
  src: string;
  file: File;
  imgElement: HTMLImageElement | null;
}

export default function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  const [cols, setCols] = useState(4);
  const [csw, setCsw] = useState(160);
  const [csh, setCsh] = useState(160);
  const [gap, setGap] = useState(6);
  const [rad, setRad] = useState(8);
  const [bgc, setBgc] = useState('#06080f');
  const [fit, setFit] = useState<'cover' | 'contain' | 'stretch' | 'original'>('cover');
  const [pad, setPad] = useState(10);
  const [showDim, setShowDim] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setBgImage(img);
          setHasRendered(false);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBg = () => {
    setBgImage(null);
    if (bgInputRef.current) bgInputRef.current.value = '';
    setHasRendered(false);
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImages(prev => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), src, file, imgElement: img }
          ]);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setHasRendered(false);
  };

  const clearAll = () => {
    setImages([]);
    clearBg();
    setHasRendered(false);
  };

  // Thumbnail drag and drop
  const handleThumbDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleThumbDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleThumbDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    setImages(prev => {
      const newArr = [...prev];
      const movedItem = newArr.splice(draggedIdx, 1)[0];
      newArr.splice(index, 0, movedItem);
      return newArr;
    });
    setDraggedIdx(null);
    setHasRendered(false);
  };

  const renderCanvas = () => {
    if (images.length === 0) {
      alert('Vui lòng thêm ít nhất 1 ảnh!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const actualCols = Math.max(1, cols);
    const rows = Math.ceil(images.length / actualCols);
    
    let cellW = csw;
    let cellH = csh;

    if (fit === 'original' && images[0].imgElement) {
      cellW = images[0].imgElement.naturalWidth;
      cellH = images[0].imgElement.naturalHeight;
    }

    const W = pad * 2 + actualCols * cellW + (actualCols - 1) * gap;
    const H = pad * 2 + rows * cellH + (rows - 1) * gap;

    canvas.width = W;
    canvas.height = H;

    // Fill background
    ctx.fillStyle = bgc;
    ctx.fillRect(0, 0, W, H);

    if (bgImage) {
      const sc = Math.max(W / bgImage.naturalWidth, H / bgImage.naturalHeight);
      const dw = bgImage.naturalWidth * sc;
      const dh = bgImage.naturalHeight * sc;
      ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }

    // Render each image
    images.forEach((item, idx) => {
      const col = idx % actualCols;
      const row = Math.floor(idx / actualCols);
      
      const x = pad + col * (cellW + gap);
      const y = pad + row * (cellH + gap);

      ctx.save();
      roundRectClip(ctx, x, y, cellW, cellH, rad);

      const img = item.imgElement;
      if (!img) return;
      
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      let sc, dw, dh;

      if (fit === 'stretch') {
        ctx.drawImage(img, x, y, cellW, cellH);
      } else if (fit === 'original') {
        ctx.drawImage(img, x + (cellW - iw) / 2, y + (cellH - ih) / 2, iw, ih);
      } else if (fit === 'contain') {
        sc = Math.min(cellW / iw, cellH / ih);
        dw = iw * sc; 
        dh = ih * sc;
        ctx.drawImage(img, x + (cellW - dw) / 2, y + (cellH - dh) / 2, dw, dh);
      } else {
        // cover
        sc = Math.max(cellW / iw, cellH / ih);
        dw = iw * sc; 
        dh = ih * sc;
        ctx.drawImage(img, x + (cellW - dw) / 2, y + (cellH - dh) / 2, dw, dh);
      }

      if (showDim) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y + cellH - 24, cellW, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${iw} × ${ih}`, x + cellW / 2, y + cellH - 12);
      }

      ctx.restore();
    });

    setHasRendered(true);
  };

  const roundRectClip = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
    ctx.clip();
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `ghep-anh-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="container">
      <header>
        <h1>Ghép Ảnh Acc Liên Quân</h1>
        <p>Kéo thả nhiều ảnh, xếp lưới, tải về 1 file PNG</p>
      </header>
      
      <div className="wrap">
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        
        <div 
          className={`dropzone ${isDragOver ? 'over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="ico"><ImageIcon size={40} /></div>
          <p>Kéo & thả ảnh vào đây, hoặc <b style={{color: 'var(--cyan)'}}>nhấn để chọn ảnh</b></p>
          <p className="dz-sub">Hỗ trợ PNG, JPG, WEBP — chọn nhiều ảnh cùng lúc</p>
        </div>

        <div className="ctrls">
          <div className="cg">
            <label>Số cột</label>
            <input type="number" value={cols} min={1} max={20} onChange={e => setCols(parseInt(e.target.value) || 1)} />
          </div>
          <div className="cg" style={{ opacity: fit === 'original' ? 0.5 : 1 }}>
            <label>Chiều rộng ô (px)</label>
            <input type="number" value={csw} min={40} max={2000} onChange={e => setCsw(parseInt(e.target.value) || 160)} disabled={fit === 'original'} />
          </div>
          <div className="cg" style={{ opacity: fit === 'original' ? 0.5 : 1 }}>
            <label>Chiều cao ô (px)</label>
            <input type="number" value={csh} min={40} max={2000} onChange={e => setCsh(parseInt(e.target.value) || 160)} disabled={fit === 'original'} />
          </div>
          <div className="cg">
            <label>Khoảng cách (px)</label>
            <input type="number" value={gap} min={0} max={80} onChange={e => setGap(parseInt(e.target.value) || 0)} />
          </div>
          <div className="cg">
            <label>Bo góc (px)</label>
            <input type="number" value={rad} min={0} max={80} onChange={e => setRad(parseInt(e.target.value) || 0)} />
          </div>
          <div className="cg">
            <label>Màu nền</label>
            <input type="color" value={bgc} onChange={e => setBgc(e.target.value)} />
          </div>
          <div className="cg">
            <label>Ảnh nền ghép</label>
            <div style={{ position: 'relative', display: 'flex', background: '#111820', border: '1px solid rgba(0,240,255,0.18)', borderRadius: '6px' }}>
              <input type="file" accept="image/*" ref={bgInputRef} onChange={handleBgChange} style={{ border: 'none', background: 'transparent', padding: '6px 24px 6px 6px', fontSize: '0.75rem', width: '100%', outline: 'none', color: '#e8eaf6' }} />
              {bgImage && (
                <div onClick={clearBg} title="Xóa ảnh nền" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', background: 'rgba(255,45,120,0.88)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>×</div>
              )}
            </div>
          </div>
          <div className="cg">
            <label>Hiển thị ảnh</label>
            <select value={fit} onChange={e => setFit(e.target.value as any)}>
              <option value="cover">Cover (Cắt vừa ô)</option>
              <option value="contain">Contain (Hiện toàn bộ)</option>
              <option value="stretch">Stretch (Kéo giãn)</option>
              <option value="original">Original (Kích cỡ gốc)</option>
            </select>
          </div>
          <div className="cg">
            <label>Kích cỡ ban đầu</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#e8eaf6', cursor: 'pointer', textTransform: 'none', fontWeight: 'normal' }}>
              <input type="checkbox" checked={showDim} onChange={e => setShowDim(e.target.checked)} style={{ width: 'auto', cursor: 'pointer', margin: 0 }} />
              Hiện WxH trên ảnh
            </label>
          </div>
          <div className="cg">
            <label>Padding viền (px)</label>
            <input type="number" value={pad} min={0} max={100} onChange={e => setPad(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="btns">
          <button className="b-up" onClick={() => fileInputRef.current?.click()}>
            <PlusCircle size={16} /> Thêm ảnh {images.length > 0 && <span>({images.length})</span>}
          </button>
          <button className="b-go" onClick={renderCanvas}>
            <RefreshCw size={16} /> Ghép ảnh
          </button>
          <button className="b-dl" onClick={downloadImage} disabled={!hasRendered}>
            <Download size={16} /> Tải về
          </button>
          <button className="b-cl" onClick={clearAll}>
            <Trash2 size={16} /> Xóa tất cả
          </button>
        </div>

        {images.length > 0 && (
          <div className="thumbs">
            {images.map((img, i) => (
              <div 
                key={img.id}
                className={`th ${draggedIdx === i ? 'drag-on' : ''}`}
                draggable
                onDragStart={(e) => handleThumbDragStart(e, i)}
                onDragOver={handleThumbDragOver}
                onDrop={(e) => handleThumbDrop(e, i)}
                onDragEnd={() => setDraggedIdx(null)}
              >
                <img src={img.src} alt={`upload-${i}`} />
                <span className="th-n">{i + 1}</span>
                {showDim && (
                  <span style={{ position: 'absolute', bottom: '2px', right: '3px', fontSize: '8px', color: '#fff', textShadow: '0 1px 2px #000', fontWeight: 'bold', pointerEvents: 'none' }}>
                    {img.imgElement?.naturalWidth}x{img.imgElement?.naturalHeight}
                  </span>
                )}
                <div className="th-x" onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}>×</div>
              </div>
            ))}
          </div>
        )}

        <div className="prev">
          <h3>Xem trước kết quả</h3>
          {!hasRendered && <p className="ph">Thêm ảnh và nhấn "Ghép ảnh" để xem kết quả</p>}
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} style={{ display: hasRendered ? 'block' : 'none' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
