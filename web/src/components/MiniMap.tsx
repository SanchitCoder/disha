import L from "leaflet";
import { useEffect, useRef } from "react";
import { CaregiverCard, Location } from "../api";

/** Leaflet + OpenStreetMap: you (blue) and the matched caregivers (the top match is larger).
 *  Page-friendly: the mouse wheel only zooms after the map is clicked (so scrolling the page never gets hijacked), one-finger touch scrolls the page,
 *  +/- controls are 44px, the map re-measures itself when its container resizes (zoom, rotation, layout change) and fits the markers on load. */
export default function MiniMap({ me, caregivers }: { me: Location; caregivers: CaregiverCard[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const map = L.map(node, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.5 }).setView([me.lat, me.lng], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    const pts: L.LatLngExpression[] = [[me.lat, me.lng]];
    L.circleMarker([me.lat, me.lng], { radius: 9, color: "#2E3A87", fillColor: "#5B67B5", fillOpacity: 0.9 }).bindTooltip("You").addTo(map);
    caregivers.forEach((c, i) => {
      pts.push([c.lat, c.lng]);
      L.circleMarker([c.lat, c.lng], { radius: i === 0 ? 11 : 7, color: "#A87A1E", fillColor: "#C9962E", fillOpacity: 0.85 }).bindTooltip(c.name).addTo(map);
    });
    const fit = () => { if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15 }); };
    fit();

    map.on("click focus", () => map.scrollWheelZoom.enable());                       // wheel-zoom only once the user has clicked the map
    map.on("mouseout blur", () => map.scrollWheelZoom.disable());
    const publish = () => { node.dataset.zoom = String(map.getZoom()); const s = map.getSize(); node.dataset.size = `${s.x}x${s.y}`; };
    map.on("zoomend resize", publish);
    publish();

    let timer: number | undefined;
    const ro = new ResizeObserver(() => {                                            // grey tiles / wrong centre after zoom or layout changes otherwise
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { map.invalidateSize({ pan: false }); fit(); publish(); }, 60);
    });
    ro.observe(node);
    return () => { window.clearTimeout(timer); ro.disconnect(); map.remove(); };
  }, [me.lat, me.lng, caregivers]);
  return <div ref={el} role="region" aria-label="Map" title="Click the map to zoom with the mouse wheel" data-testid="mini-map"
    className="h-[clamp(12rem,38dvh,20rem)] w-full overflow-hidden rounded-2xl border border-slate-200" />;
}
