/**
 * ImgBB-backed photo storage.
 *
 * Every user-uploaded image (produce/listing photos, avatars, supplier
 * product photos) is POSTed to the ImgBB API and the returned absolute
 * URL is what the application stores and renders. ImgBB needs the raw
 * bytes, so uploads always run through multer's memory storage.
 *
 * Required env: IMGBB_API_KEY (https://api.imgbb.com).
 */
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

const uploadToImgbb = async (buffer, filename = "upload.jpg", mimetype = "image/jpeg") => {
  if (!IMGBB_API_KEY) {
    const err = new Error("Image storage is not configured (IMGBB_API_KEY missing).");
    err.statusCode = 503;
    throw err;
  }

  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mimetype }), filename);

  let response;
  try {
    response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(IMGBB_API_KEY)}`, {
      method: "POST",
      body: form,
      // Never let a slow image host hang the request.
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      const timeoutErr = new Error("Image storage timed out. Please try again.");
      timeoutErr.statusCode = 503;
      throw timeoutErr;
    }
    const offlineErr = new Error("Image storage is unreachable right now. Please try again later.");
    offlineErr.statusCode = 503;
    throw offlineErr;
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result?.success || !result?.data?.url) {
    const uploadErr = new Error("Image storage rejected the upload. Please try again.");
    uploadErr.statusCode = 503;
    throw uploadErr;
  }

  // `data.url` is the permanent absolute https URL the frontend renders.
  return result.data.url;
};

module.exports = { uploadToImgbb };
