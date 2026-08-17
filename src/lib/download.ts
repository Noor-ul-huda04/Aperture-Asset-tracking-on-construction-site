export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('Blob download failed, attempting fallback data URL/window.open', err);
    try {
      const dataUri = content instanceof Blob 
        ? URL.createObjectURL(content) 
        : `data:${mimeType};charset=utf-8,${encodeURIComponent(content as string)}`;
      const newWindow = window.open(dataUri, '_blank');
      if (!newWindow) {
        throw new Error('Popup blocked');
      }
    } catch (fallbackErr) {
      console.error('All download methods failed:', fallbackErr);
      alert('File download was blocked by browser sandbox. Please open the app in a new tab to download files.');
    }
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn('DataURL download failed, attempting window.open', err);
    window.open(dataUrl, '_blank');
  }
}
