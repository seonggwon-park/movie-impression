const allowedImageProxyHostnames = new Set(["image.tmdb.org"]);

export function isAllowedImageProxyUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    allowedImageProxyHostnames.has(url.hostname.toLowerCase()) &&
    url.pathname.startsWith("/t/p/")
  );
}

export function getProxiedImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    if (!isAllowedImageProxyUrl(url)) {
      return imageUrl;
    }

    return `/api/image-proxy?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return imageUrl;
  }
}
