import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Check, X, Loader2 } from 'lucide-react';
import { IMGBB_API_KEY } from '../constants';

export const AvatarCropModal = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const handleCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const generateCroppedImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));
      canvas.width = 200;
      canvas.height = 200;
      ctx.beginPath();
      ctx.arc(100, 100, 100, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 200, 200);
      
      canvas.toBlob(async (blob) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', blob);
        
        try {
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
          });
          const json = await res.json();
          if (json.success) {
            onCropComplete(json.data.url);
          } else {
            throw new Error('ImgBB 返回错误');
          }
        } catch (error) {
          console.error('头像上传失败', error);
          alert('头像上传失败');
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg', 0.8);
    } catch (e) {
      console.error('裁剪处理失败', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-[400px] bg-slate-900 rounded-2xl overflow-hidden mb-6 shadow-2xl">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={handleCropComplete}
          onZoomChange={onZoomChange}
        />
      </div>
      <div className="flex gap-4 w-full max-w-md">
        <button onClick={onCancel} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">
          取消
        </button>
        <button onClick={generateCroppedImage} disabled={uploading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
          {uploading ? '上传中...' : '确定并上传'}
        </button>
      </div>
    </div>
  );
};