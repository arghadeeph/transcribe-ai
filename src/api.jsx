import config from './config';

// V1
export const uploadFile = async (file, language) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await fetch(`${config.API_BASE_URL}/api/v1/transcribe/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
};

//V2
export const uploadFileV2 = async (file, language) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await fetch(`${config.API_BASE_URL}/api/v2/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json(); // returns { job_id }
};