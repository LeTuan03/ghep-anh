import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { createEmptySections } from './constants';
import type { ImageData, ImageSections, SectionKey } from './types';

const loadImageFile = (file: File): Promise<ImageData | null> =>
  new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const src = event.target?.result;

      if (typeof src !== 'string') {
        resolve(null);
        return;
      }

      const image = new Image();
      image.onload = () => {
        resolve({
          id: crypto.randomUUID(),
          src,
          imgElement: image,
        });
      };
      image.onerror = () => resolve(null);
      image.src = src;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const loadImages = async (files: FileList | File[]) => {
  const results = await Promise.all(Array.from(files).map(loadImageFile));
  return results.filter((image): image is ImageData => image !== null);
};

export function useHomeSections() {
  const [sections, setSections] = useState<ImageSections>(() => createEmptySections());
  const [dragSection, setDragSection] = useState<SectionKey | null>(null);

  const addFilesToSection = async (files: FileList | File[], section: SectionKey) => {
    const images = await loadImages(files);

    if (!images.length) {
      return;
    }

    setSections((currentSections) => ({
      ...currentSections,
      [section]: [...currentSections[section], ...images],
    }));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, section: SectionKey) => {
    if (event.target.files) {
      await addFilesToSection(event.target.files, section);
    }

    event.target.value = '';
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, section: SectionKey) => {
    event.preventDefault();
    setDragSection(null);

    if (event.dataTransfer.files.length > 0) {
      await addFilesToSection(event.dataTransfer.files, section);
    }
  };

  const removeImage = (section: SectionKey, index: number) => {
    setSections((currentSections) => ({
      ...currentSections,
      [section]: currentSections[section].filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const clearSections = () => {
    setSections(createEmptySections());
    setDragSection(null);
  };

  return {
    sections,
    dragSection,
    setDragSection,
    handleFileChange,
    handleDrop,
    removeImage,
    clearSections,
  };
}
