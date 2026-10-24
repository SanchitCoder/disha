import L from "leaflet";
import { useEffect, useRef } from "react";
import { CaregiverCard, Location } from "../api";

/** Leaflet + OpenStreetMap: you (blue) and the matched caregivers (green; the top match is larger). */
export default function MiniMap({ me, caregivers }: { me: Location; caregivers: CaregiverCard[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([me.lat, me.lng], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    const pts: L.LatLngExpression[] = [[me.lat, me.lng]];
    L.circleMarker([me.lat, me.lng], { radius: 9, color: "#1d4ed8", fillOpacity: 0.9 }).bindTooltip("You").addTo(map);
    caregivers.forEach((c, i) => {
      pts.push([c.lat, c.lng]);
      L.circleMarker([c.lat, c.lng], { radius: i === 0 ? 11 : 7, color: "#2E3A87", fillOpacity: 0.85 }).bindTooltip(c.name).addTo(map);
    });
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
    return () => void map.remove();
  }, [me.lat, me.lng, caregivers]);
  return <div ref={el} className="h-48 w-full overflow-hidden rounded-2xl border border-slate-200" />;
}
