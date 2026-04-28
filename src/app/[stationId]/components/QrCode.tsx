"use client";

import { ReactQRCode } from "@lglab/react-qr-code";

export default function QrCode({stationId}: {stationId: string}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Scan to Join</h2>
            <ReactQRCode value={`${window.location.origin}/${stationId}`} size={200} />
        </div>
    );
}