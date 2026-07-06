import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ApiFarm } from "../lib/api/holdings";
import type { ApiMovementRecord } from "../lib/api/movements";

interface Props {
  holdings: ApiFarm[];
  movements?: ApiMovementRecord[];
  height?: string;
}

const PURPOSE_LABELS: Record<string, string> = {
  sale: "Sale",
  grazing: "Grazing",
  breeding: "Breeding",
  slaughter: "Slaughter",
  exhibition: "Exhibition",
  other: "Transfer",
};

export function HoldingsMap({ holdings, movements = [], height = "420px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-init in StrictMode
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [-0.0236, 37.9062],
      6,
    );
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Build farm coord lookup for movement lines
    const farmCoords: Record<number, L.LatLngTuple> = {};

    const mappable = holdings.filter(
      (h) => h.gps_latitude != null && h.gps_longitude != null,
    );

    const boundsPoints: L.LatLngTuple[] = [];

    for (const h of mappable) {
      const lat = parseFloat(h.gps_latitude!);
      const lng = parseFloat(h.gps_longitude!);
      farmCoords[h.id] = [lat, lng];
      boundsPoints.push([lat, lng]);

      const popup = `
        <div style="line-height:1.6;min-width:200px">
          <strong style="font-size:0.95rem">${h.name}</strong><br/>
          <span style="color:#6b7280;font-size:0.8rem">Reg: ${h.registration_no}</span><br/>
          <span style="font-size:0.85rem">📍 ${[h.ward, h.sub_county, h.county].filter(Boolean).join(", ")}</span><br/>
          <span style="font-size:0.85rem">🐄 ${h.animal_count} animal${h.animal_count !== 1 ? "s" : ""}</span>
          ${h.total_area_acres ? `<br/><span style="font-size:0.85rem">📐 ${h.total_area_acres} acres</span>` : ""}
          <br/><span style="color:#6b7280;font-size:0.75rem">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
        </div>
      `;

      L.marker([lat, lng]).addTo(map).bindPopup(popup, { maxWidth: 260 });
    }

    // Draw movement polylines
    for (const m of movements) {
      const from = m.origin_farm != null ? farmCoords[m.origin_farm] : null;
      const to = m.destination_farm != null ? farmCoords[m.destination_farm] : null;
      if (!from || !to) continue;

      const linePopup = `
        <div style="line-height:1.6;font-size:0.85rem">
          <strong>Movement</strong><br/>
          🐄 RFID: ${m.animal_tag}<br/>
          📋 ${PURPOSE_LABELS[m.purpose] ?? m.purpose}<br/>
          📅 ${m.move_date}
        </div>
      `;

      L.polyline([from, to], {
        color: "#3b82f6",
        weight: 2.5,
        dashArray: "7 5",
        opacity: 0.8,
      })
        .addTo(map)
        .bindPopup(linePopup);
    }

    // Fit map to holdings if any are mapped
    if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 12);
    } else if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [holdings, movements]);

  return (
    <div style={{ isolation: "isolate" }}>
      <div
        ref={containerRef}
        style={{ height, width: "100%", borderRadius: "0 0 0.5rem 0.5rem" }}
      />
    </div>
  );
}
