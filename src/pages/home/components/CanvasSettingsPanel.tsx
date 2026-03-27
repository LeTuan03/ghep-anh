import type { CanvasSettings } from '../types';

interface CanvasSettingsPanelProps {
  settings: CanvasSettings;
  onChange: <Key extends keyof CanvasSettings>(key: Key, value: CanvasSettings[Key]) => void;
}

const parseNumber = (value: string, fallback: number) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

export default function CanvasSettingsPanel({ settings, onChange }: CanvasSettingsPanelProps) {
  return (
    <div className="opts-group">
      <div className="opts-title">THÔNG SỐ CANVAS TỔNG THỂ</div>

      <div className="opts-row">
        <div className="cg">
          <label>Chiều Rộng (px)</label>
          <input
            type="number"
            min={400}
            max={8000}
            value={settings.width}
            onChange={(event) => onChange('width', parseNumber(event.target.value, 1920))}
          />
        </div>

        <div className="cg">
          <label>Thưa giữa các phần</label>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.gap}
            onChange={(event) => onChange('gap', parseNumber(event.target.value, 0))}
          />
        </div>

        <div className="cg">
          <label>Bo góc chung (px)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.radius}
            onChange={(event) => onChange('radius', parseNumber(event.target.value, 0))}
          />
        </div>

        <div className="cg">
          <label>Viền mép ngoài ảnh</label>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.padding}
            onChange={(event) => onChange('padding', parseNumber(event.target.value, 5))}
          />
        </div>

        <div className="cg">
          <label>Màu nền</label>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(event) => onChange('backgroundColor', event.target.value)}
          />
        </div>

        <div className="cg">
          <label>Kiểu viền tổng</label>
          <select
            value={settings.borderStyle}
            onChange={(event) => onChange('borderStyle', event.target.value as CanvasSettings['borderStyle'])}
          >
            <option value="solid">Màu đơn sắc</option>
            <option value="gradient1">Gradient (Hồng - Xanh)</option>
          </select>
        </div>

        {settings.borderStyle === 'solid' && (
          <div className="cg">
            <label>Màu viền đơn</label>
            <input
              type="color"
              value={settings.borderColor}
              onChange={(event) => onChange('borderColor', event.target.value)}
            />
          </div>
        )}

        <div className="cg">
          <label>Độ dày viền (px)</label>
          <input
            type="number"
            min={0}
            max={200}
            value={settings.borderWidth}
            onChange={(event) => onChange('borderWidth', parseNumber(event.target.value, 0))}
          />
        </div>
      </div>
    </div>
  );
}
