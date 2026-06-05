import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

import { useEffect, useState } from "react";

import { get, ref, set } from "firebase/database";
import { db } from "../../api/firebase";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  open: boolean;
  onClose: () => void;
  user: any;
  companyId: string | null;
}

function LocationPicker({
  position,
  onSelect,
}: {
  position: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export function AssignLocationDialog({
  open,
  onClose,
  user,
  companyId,
}: Props) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState(100);
  const [locationName, setLocationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -26.2041, 28.0473,
  ]);

  useEffect(() => {
    if (!open) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error(error);
      }
    );
  }, [open]);

  const loadLocation = async () => {
    try {
      const snap = await get(
        ref(db, `companies/${companyId}/userLocations/${user.uid}`)
      );

      const data = snap.val();

      if (data) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setRadius(data.radius || 100);
        setLocationName(data.locationName || "");
      } else {
        setLatitude(null);
        setLongitude(null);
        setRadius(100);
        setLocationName("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const save = async () => {
    if (!companyId || !user) return;

    if (!latitude || !longitude) {
      alert("Please select a location on the map");
      return;
    }

    try {
      setSaving(true);

      await set(ref(db, `companies/${companyId}/userLocations/${user.uid}`), {
        userId: user.uid,
        userName: user.name || "",
        latitude,
        longitude,
        radius,
        locationName,
        updatedAt: new Date().toISOString(),
      });

      setSuccessOpen(true);

      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  const position =
    latitude && longitude ? ([latitude, longitude] as [number, number]) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Assign Clock-In Location
        <Typography variant="body2" color="text.secondary">
          {user?.name || user?.email}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="Location Name"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            fullWidth
          />

          <TextField
            label="Allowed Radius (Meters)"
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            fullWidth
          />

          <Box
            sx={{
              height: 500,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <MapContainer
              center={position || mapCenter}
              zoom={14}
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationPicker
                position={position}
                onSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />

              {position && (
                <>
                  <Marker position={position} />

                  <Circle center={position} radius={radius} />
                </>
              )}
            </MapContainer>
          </Box>

          {latitude && longitude && (
            <Box>
              <Typography variant="body2">Latitude: {latitude}</Typography>

              <Typography variant="body2">Longitude: {longitude}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={save} disabled={saving}>
          Save Location
        </Button>
      </DialogActions>

      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
      >
        <Alert severity="success" variant="filled">
          Location saved successfully
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
