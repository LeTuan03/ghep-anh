import { useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Layers } from 'lucide-react';
import type { ImageData, SectionKey } from '../types';

interface DropZoneSectionProps {
  sectionKey: SectionKey;
  label: string;
  description?: string;
  images: ImageData[];
  isDragOver: boolean;
  borderedThumbs?: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, section: SectionKey) => void | Promise<void>;
  onDragOver: (section: SectionKey) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>, section: SectionKey) => void | Promise<void>;
  onRemove: (section: SectionKey, index: number) => void;
}

export default function DropZoneSection({
  sectionKey,
  label,
  description,
  images,
  isDragOver,
  borderedThumbs,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: DropZoneSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="section-box">
      <label className="section-label">{label}</label>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(event) => onFileChange(event, sectionKey)}
      />

      <div
        className={`dropzone dz-mini ${isDragOver ? 'over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          onDragOver(sectionKey);
        }}
        onDragLeave={onDragLeave}
        onDrop={(event) => {
          void onDrop(event, sectionKey);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="ico">
          <Layers size={20} />
        </div>
        <p>Kéo thả hoặc bấm để chọn ảnh</p>
        <p className="dz-sub">{description || 'Hỗ trợ chọn nhiều ảnh cùng lúc'}</p>
      </div>

      {images.length > 0 && (
        <div className="thumbs">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`th ${borderedThumbs ? 'th-bordered' : ''}`}
            >
              <img src={image.src} alt={`${label} ${index + 1}`} />
              <span className="th-n">{index + 1}</span>
              <button
                type="button"
                className="th-x"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(sectionKey, index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
