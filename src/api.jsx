export const uploadFile = async (file, language) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await fetch("http://127.0.0.1:8000/api/transcribe/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
};