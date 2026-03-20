import config from './config';

export const uploadFile = async (file, language) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await fetch(`${config.API_BASE_URL}/api/transcribe/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
};