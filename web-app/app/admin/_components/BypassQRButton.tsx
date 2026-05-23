"use client";

import { useTransition } from "react";
import QRCode from "qrcode";
import { getBypassCode } from "../actions";

export function BypassQRButton() {
  const [pending, start] = useTransition();

  const download = () =>
    start(async () => {
      try {
        const code = await getBypassCode();
        const dataUrl = await QRCode.toDataURL(code, {
          width: 512,
          margin: 2,
        });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "bypass-ticket.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to generate QR");
      }
    });

  return (
    <button
      onClick={download}
      disabled={pending}
      className="rounded border border-gray-400 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
      title="Generates a QR for the MASTER_BYPASS_CODE in .env. Scans always validate as 'BYPASS' and never get marked used."
    >
      {pending ? "Generating…" : "Download bypass QR"}
    </button>
  );
}
