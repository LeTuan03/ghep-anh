export type SectionKey = 'header' | 'profile' | 'midVIP' | 'midSkins' | 'footer';

export type CellType = 'vip' | 'skin' | 'footer';

export type BorderStyle = 'solid' | 'gradient1';

export interface ImageData {
  id: string;
  src: string;
  imgElement: HTMLImageElement;
}

export type ImageSections = Record<SectionKey, ImageData[]>;

export interface CanvasSettings {
  width: number;
  gap: number;
  radius: number;
  backgroundColor: string;
  padding: number;
  borderColor: string;
  borderStyle: BorderStyle;
  borderWidth: number;
}

export interface SectionConfig {
  key: SectionKey;
  label: string;
  description?: string;
  borderedThumbs?: boolean;
}
