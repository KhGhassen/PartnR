import * as ImagePicker from 'expo-image-picker';
import client from './client';

export const uploadImage = (uri: string, mimeType?: string, fileName?: string) => {
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileName ?? 'photo.jpg',
    type: mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  return client
    .post<{ id: string; url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
    .then((r) => r.data);
};

// Opens the gallery, uploads the selected image, returns its URL (null if cancelled).
export const pickAndUploadImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const { url } = await uploadImage(asset.uri, asset.mimeType ?? undefined, asset.fileName ?? undefined);
  return url;
};
