// Cloudinary delivers a resized, format-optimised version when
// transformation parameters are inserted after "/upload/".
// Non-Cloudinary URLs are returned unchanged.
export const optimizeImage = (url: string, width: number): string => {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const [head, tail] = url.split("/upload/");

  // Already transformed (e.g. starts with f_auto or w_...)
  if (/^[a-z]_[^/]+\//.test(tail ?? "")) {
    return url;
  }

  return `${head}/upload/f_auto,q_auto,w_${width}/${tail}`;
};
