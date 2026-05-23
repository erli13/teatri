import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

// Point this at the LAN IP of the machine running `next dev --webpack`.
// Find yours from the Next.js startup log ("Network: http://<ip>:3000").
const API_BASE_URL = "http://192.168.0.181:3000";

// Must match SCANNER_API_KEY in web-app/.env. In production, load from a
// secure store (expo-secure-store) or a per-device login flow instead of
// embedding it in the source.
const SCANNER_API_KEY = "dev-scanner-key-replace-me";

type ScanResult =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "granted"; movie: string; row: string; seat: number }
  | {
      kind: "denied";
      message: string;
      // For ALREADY USED tickets the API still returns the seat details so
      // staff can verify the holder is sitting in the right place.
      seatInfo?: { movie: string; row: string; seat: number };
    };

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult>({ kind: "idle" });
  const inflightRef = useRef(false);

  const reset = useCallback(() => {
    inflightRef.current = false;
    setResult({ kind: "idle" });
  }, []);

  const handleScan = useCallback(async (event: BarcodeScanningResult) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setResult({ kind: "loading" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SCANNER_API_KEY}`,
        },
        body: JSON.stringify({ qrHash: event.data }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setResult({
          kind: "granted",
          movie: data.movie,
          row: data.row,
          seat: data.seat,
        });
      } else {
        const hasSeat =
          typeof data?.movie === "string" &&
          typeof data?.row === "string" &&
          typeof data?.seat === "number";
        setResult({
          kind: "denied",
          message: data?.error ?? `Request failed (HTTP ${res.status})`,
          seatInfo: hasSeat
            ? { movie: data.movie, row: data.row, seat: data.seat }
            : undefined,
        });
      }
    } catch (err) {
      setResult({
        kind: "denied",
        message:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Network error",
      });
    }
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan tickets.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
        <StatusBar style="light" />
      </View>
    );
  }

  if (result.kind === "granted") {
    return (
      <View style={[styles.resultScreen, styles.grantedBg]}>
        <Text style={styles.resultHeadline}>ACCESS GRANTED</Text>
        <View style={styles.detailsBox}>
          <Detail label="Movie" value={result.movie} />
          <Detail label="Row" value={result.row} />
          <Detail label="Seat" value={String(result.seat)} />
        </View>
        <Pressable style={styles.scanNextButton} onPress={reset}>
          <Text style={styles.scanNextText}>Scan Next</Text>
        </Pressable>
        <StatusBar style="light" />
      </View>
    );
  }

  if (result.kind === "denied") {
    return (
      <View style={[styles.resultScreen, styles.deniedBg]}>
        <Text style={styles.resultHeadline}>ACCESS DENIED</Text>
        <Text style={styles.deniedMessage}>{result.message}</Text>
        {result.seatInfo && (
          <View style={styles.detailsBox}>
            <Text style={styles.deniedSeatTitle}>
              Ticket holder&apos;s assigned seat
            </Text>
            <Detail label="Movie" value={result.seatInfo.movie} />
            <Detail label="Row" value={result.seatInfo.row} />
            <Detail label="Seat" value={String(result.seatInfo.seat)} />
          </View>
        )}
        <Pressable style={styles.scanNextButton} onPress={reset}>
          <Text style={styles.scanNextText}>Try Again</Text>
        </Pressable>
        <StatusBar style="light" />
      </View>
    );
  }

  const scanning = result.kind === "idle";

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? handleScan : undefined}
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.guide}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.hint}>Align the QR code inside the frame</Text>
      </View>

      {result.kind === "loading" && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Validating ticket…</Text>
        </View>
      )}

      <StatusBar style="light" />
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const GUIDE_SIZE = 260;
const CORNER = 28;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#111",
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  guide: { width: GUIDE_SIZE, height: GUIDE_SIZE },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#fff",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  hint: {
    marginTop: 24,
    color: "#fff",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#fff", marginTop: 12, fontSize: 16 },

  resultScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  grantedBg: { backgroundColor: "#16a34a" },
  deniedBg: { backgroundColor: "#dc2626" },
  resultHeadline: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 32,
  },
  detailsBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  detailLabel: { color: "rgba(255,255,255,0.85)", fontSize: 16 },
  detailValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  deniedSeatTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  deniedMessage: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  scanNextButton: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  scanNextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
