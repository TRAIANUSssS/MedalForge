import { toPng } from "html-to-image";

const SCREENSHOT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='100%25' height='100%25' fill='rgba(255,255,255,0)'/%3E%3C/svg%3E";

function isCrossOriginImage(node: HTMLElement) {
  if (!(node instanceof HTMLImageElement)) return false;
  if (!node.currentSrc && !node.src) return false;

  try {
    const resolvedUrl = new URL(node.currentSrc || node.src, window.location.href);
    return resolvedUrl.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export async function capturePageAsPng(node: HTMLElement, fileName: string) {
  const width = node.scrollWidth;
  const height = node.scrollHeight;

  const dataUrl = await toPng(node, {
    cacheBust: true,
    imagePlaceholder: SCREENSHOT_IMAGE_PLACEHOLDER,
    pixelRatio: 2,
    width,
    height,
    canvasWidth: width * 2,
    canvasHeight: height * 2,
    filter: (domNode) => {
      if (!(domNode instanceof HTMLElement)) return true;
      if (domNode.dataset.screenshotIgnore === "true") return false;
      if (isCrossOriginImage(domNode)) return false;
      return true;
    },
  });

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
