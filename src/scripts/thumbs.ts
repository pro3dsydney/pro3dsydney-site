/** Thumbnail for the upload list: image preview for photos, a 3D render for models. */
export async function thumbnailFor(file: File): Promise<HTMLElement | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (file.type.startsWith('image/') && !/heic|heif/.test(ext)) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = URL.createObjectURL(file);
    return img;
  }
  if (['stl', 'obj', '3mf'].includes(ext) && file.size < 60 * 1048576) {
    const { loadGeometry, renderThumb } = await import('./mesh'); // three.js loads only when needed
    const geo = await loadGeometry(file);
    const url = geo && renderThumb(geo);
    if (url) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = url;
      img.style.objectFit = 'contain';
      return img;
    }
  }
  return null;
}
