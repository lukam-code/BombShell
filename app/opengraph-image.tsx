import { ImageResponse } from "next/og";

export const alt = "BOMBSHELL – Salon lepote, Novi Sad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF9FA 0%, #FCE8EE 45%, #E8A0B4 100%)",
          color: "#2D2D2D",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 112, letterSpacing: 24, fontWeight: 600 }}>BOMBSHELL</div>
        <div style={{ width: 160, height: 2, background: "#C9A96E", margin: "28px 0" }} />
        <div style={{ fontSize: 40, letterSpacing: 10, textTransform: "uppercase", color: "#8A6D35" }}>Salon lepote · Novi Sad</div>
        <div style={{ fontSize: 30, marginTop: 36, color: "#6B6B6B" }}>Frizer · Manikir · Trepavice · Masaže</div>
      </div>
    ),
    size,
  );
}
