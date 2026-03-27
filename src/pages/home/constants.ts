import type { CanvasSettings, ImageSections, SectionConfig } from './types';

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  width: 1920,
  gap: 0,
  radius: 0,
  backgroundColor: '#0b1426',
  padding: 5,
  borderColor: '#373a68',
  borderStyle: 'solid',
  borderWidth: 1,
};

export const createEmptySections = (): ImageSections => ({
  header: [],
  profile: [],
  midVIP: [],
  midSkins: [],
  footer: [],
});

export const TOP_SECTIONS: SectionConfig[] = [
  {
    key: 'header',
    label: '1. Phần Đầu (Chữ nhật ngang)',
    description: 'Kéo thả ảnh phần đầu vào đây',
    borderedThumbs: true,
  },
  {
    key: 'profile',
    label: '1.1 Profile (Đầu hàng 2)',
    description: 'Kéo thả ảnh profile vào đây',
    borderedThumbs: true,
  },
];

export const MIDDLE_SECTIONS: SectionConfig[] = [
  {
    key: 'midVIP',
    label: '2.1 Ảnh KHÔNG viền',
  },
  {
    key: 'midSkins',
    label: '2.2 Nhóm ảnh viền chung',
  },
];

export const FOOTER_SECTION: SectionConfig = {
  key: 'footer',
  label: '3. Phần Cuối',
};
