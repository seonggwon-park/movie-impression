import { isAllowedImageProxyUrl } from "@/lib/image-proxy";

const maxImageBytes = 8 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return jsonError("이미지 URL이 필요해요.", 400);
  }

  let imageUrl: URL;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return jsonError("올바른 이미지 URL이 아니에요.", 400);
  }

  if (!isAllowedImageProxyUrl(imageUrl)) {
    return jsonError("허용되지 않은 이미지 주소예요.", 400);
  }

  try {
    const response = await fetch(imageUrl.toString(), {
      headers: {
        accept: "image/*",
      },
    });

    if (!response.ok) {
      return jsonError("포스터 이미지를 불러오지 못했어요.", 502);
    }

    const finalUrl = new URL(response.url);

    if (!isAllowedImageProxyUrl(finalUrl)) {
      return jsonError("허용되지 않은 이미지 이동 경로예요.", 400);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      return jsonError("이미지 응답이 아니에요.", 400);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);

    if (contentLength > maxImageBytes) {
      return jsonError("이미지 파일이 너무 커요.", 413);
    }

    const imageBuffer = await response.arrayBuffer();

    if (imageBuffer.byteLength > maxImageBytes) {
      return jsonError("이미지 파일이 너무 커요.", 413);
    }

    return new Response(imageBuffer, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
        "Content-Length": String(imageBuffer.byteLength),
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Image proxy fetch failed", error);
    return jsonError("포스터 이미지를 불러오는 중 문제가 생겼어요.", 502);
  }
}
