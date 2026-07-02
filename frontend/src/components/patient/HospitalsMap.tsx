// React компонента: мапа со болници.
"use client";

import { Icon } from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { HospitalResponse } from "@/types/api";
import "leaflet/dist/leaflet.css";

// Approximate centre of North Macedonia
const MK_CENTER: [number, number] = [41.6086, 21.7453];
const MK_ZOOM = 8;

// Custom marker icons (cyan = matches filters, gray = filtered out)
const matchIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#06b6d4" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -34],
});

const dimIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#cbd5e1" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`),
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -28],
});

interface HospitalsMapProps {
  hospitals: HospitalResponse[];
  matchingHospitalIds: Set<number>;
  selectedHospitalId: number | null;
  onSelectHospital: (id: number) => void;
  doctorCountByHospital: Map<number, number>;
}

function FlyToSelected({
  hospital,
}: {
  hospital: HospitalResponse | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (!hospital || hospital.latitude == null || hospital.longitude == null) return;
    map.flyTo([Number(hospital.latitude), Number(hospital.longitude)], 11, {
      duration: 0.8,
    });
  }, [hospital, map]);
  return null;
}

export default function HospitalsMap({
  hospitals,
  matchingHospitalIds,
  selectedHospitalId,
  onSelectHospital,
  doctorCountByHospital,
}: HospitalsMapProps) {
  const selected = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId),
    [hospitals, selectedHospitalId],
  );

  return (
    <MapContainer
      center={MK_CENTER}
      zoom={MK_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: 500 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected hospital={selected} />
      {hospitals.map((h) => {
        if (h.latitude == null || h.longitude == null) return null;
        const matches = matchingHospitalIds.has(h.id);
        const count = doctorCountByHospital.get(h.id) ?? 0;
        return (
          <Marker
            key={h.id}
            position={[Number(h.latitude), Number(h.longitude)]}
            icon={matches ? matchIcon : dimIcon}
            eventHandlers={{ click: () => onSelectHospital(h.id) }}
          >
            <Popup>
              <div className="font-sans">
                <p className="font-semibold text-slate-900">{h.name}</p>
                <p className="text-xs text-slate-500">
                  {h.city}
                  {h.type ? ` · ${h.type}` : ""}
                </p>
                {matches && count > 0 && (
                  <p className="mt-1 text-xs font-medium text-cyan-700">
                    {count} matching doctor{count === 1 ? "" : "s"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSelectHospital(h.id)}
                  className="mt-2 inline-block text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                >
                  Select this hospital →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
