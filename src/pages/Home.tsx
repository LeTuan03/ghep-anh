import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import '../App.css';
import CanvasSettingsPanel from './home/components/CanvasSettingsPanel';
import DropZoneSection from './home/components/DropZoneSection';
import {
  DEFAULT_CANVAS_SETTINGS,
  FOOTER_SECTION,
  MIDDLE_SECTIONS,
  TOP_SECTIONS,
} from './home/constants';
import { renderHomeCanvas } from './home/renderHomeCanvas';
import { useHomeSections } from './home/useHomeSections';
import type { CanvasSettings } from './home/types';

interface HomeProps {
  onLogout?: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_CANVAS_SETTINGS);
  const [hasRendered, setHasRendered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    sections,
    dragSection,
    setDragSection,
    handleFileChange,
    handleDrop,
    removeImage,
    clearSections,
  } = useHomeSections();

  useEffect(() => {
    setHasRendered(false);
  }, [sections, settings]);

  const updateSetting = <Key extends keyof CanvasSettings>(
    key: Key,
    value: CanvasSettings[Key],
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };

  const handleRender = () => {
    if (!canvasRef.current) {
      return;
    }

    const result = renderHomeCanvas(canvasRef.current, sections, settings);

    if (!result.ok) {
      alert(result.error);
      return;
    }

    setHasRendered(true);
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      return;
    }

    const link = document.createElement('a');
    link.download = `ghep-anh-lien-quan-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    clearSections();
    setHasRendered(false);
  };

  return (
    <div className="container">
      <header>
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>
            Đăng xuất
          </button>
        )}
      </header>

      <div className="wrap">
        <div className="sections-grid">
          {TOP_SECTIONS.map((section) => (
            <DropZoneSection
              key={section.key}
              sectionKey={section.key}
              label={section.label}
              description={section.description}
              images={sections[section.key]}
              isDragOver={dragSection === section.key}
              borderedThumbs={section.borderedThumbs}
              onFileChange={handleFileChange}
              onDragOver={setDragSection}
              onDragLeave={() => setDragSection(null)}
              onDrop={handleDrop}
              onRemove={removeImage}
            />
          ))}

          <div className="section-group">
            <h3 className="section-group-title">2. Phần Giữa</h3>

            {MIDDLE_SECTIONS.map((section) => (
              <DropZoneSection
                key={section.key}
                sectionKey={section.key}
                label={section.label}
                description={section.description}
                images={sections[section.key]}
                isDragOver={dragSection === section.key}
                borderedThumbs={section.borderedThumbs}
                onFileChange={handleFileChange}
                onDragOver={setDragSection}
                onDragLeave={() => setDragSection(null)}
                onDrop={handleDrop}
                onRemove={removeImage}
              />
            ))}
          </div>

          <DropZoneSection
            sectionKey={FOOTER_SECTION.key}
            label={FOOTER_SECTION.label}
            description={FOOTER_SECTION.description}
            images={sections[FOOTER_SECTION.key]}
            isDragOver={dragSection === FOOTER_SECTION.key}
            borderedThumbs={FOOTER_SECTION.borderedThumbs}
            onFileChange={handleFileChange}
            onDragOver={setDragSection}
            onDragLeave={() => setDragSection(null)}
            onDrop={handleDrop}
            onRemove={removeImage}
          />
        </div>

        <CanvasSettingsPanel settings={settings} onChange={updateSetting} />

        <div className="btns">
          <button className="b-go" onClick={handleRender}>
            <RefreshCw size={16} /> Bắt đầu Ghép
          </button>
          <button className="b-dl" onClick={handleDownload} disabled={!hasRendered}>
            <Download size={16} /> Tải về máy
          </button>
          <button className="b-cl" onClick={handleClear}>
            <Trash2 size={16} /> Xóa sạch
          </button>
        </div>

        <div className="prev">
          <h3>Xem trước Kết quả (Max Resolution)</h3>
          {!hasRendered && (
            <p className="ph">Thêm ảnh rồi nhấn "Bắt đầu Ghép" để xem kết quả siêu nét nhé!</p>
          )}

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              className="preview-canvas"
              hidden={!hasRendered}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
