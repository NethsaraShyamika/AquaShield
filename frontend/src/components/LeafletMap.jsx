import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ✅ Defined OUTSIDE LeafletMap so it doesn't remount on every render
function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({ lat, lng, onChange }) {
  return (
    <MapContainer
      center={[lat || 7.8731, lng || 80.7718]}
      zoom={lat && lng ? 10 : 6}
      style={{ height: 280, width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {lat && lng && <Marker position={[lat, lng]} icon={markerIcon} />}
      <ClickHandler onChange={onChange} /> {/* ✅ pass onChange as a prop */}
    </MapContainer>
  );
}