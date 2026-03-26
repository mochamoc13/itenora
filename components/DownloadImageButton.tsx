"use client";

import { toPng } from "html-to-image";

export default function DownloadImageButton() {
  const handleDownload = async () => {
    const node = document.getElementById("itinerary-image");

    if (!node) {
      console.error("itinerary-image not found");
      return;
    }

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: node.scrollWidth,
        height: node.scrollHeight,
        canvasWidth: node.scrollWidth * 2,
        canvasHeight: node.scrollHeight * 2,
        style: {
          margin: "0",
          transform: "none",
        },
      });

      const link = document.createElement("a");
      link.download = `itenora-trip-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      Save to phone
    </button>
  );
}