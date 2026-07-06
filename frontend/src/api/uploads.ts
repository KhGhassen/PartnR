import api from './client';

export const uploadImage = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<{ id: string; url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
    .then((r) => r.data);
};
