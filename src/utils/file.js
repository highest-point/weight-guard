import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants';

// File utilities
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  const resourceType = (isImage || isPdf) ? 'image' : 'raw';

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );
    const json = await res.json();
    if (json.secure_url) {
      return {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        url: json.secure_url,
        name: file.name,
        type: resourceType,
        format: json.format || file.name.split('.').pop().toLowerCase()
      };
    } else {
      throw new Error(json.error?.message || 'Upload failed');
    }
  } catch (e) {
    console.error('Cloudinary Upload Error:', e);
    alert(`上传失败: ${e.message}`);
    return null;
  }
};

// URL utilities
export const getActionUrl = (attachment) => {
  if (!attachment) return '#';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(attachment.format)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(attachment.url)}`;
  }
  return attachment.url;
};