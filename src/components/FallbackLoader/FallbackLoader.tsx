import "@esri/calcite-components/components/calcite-loader";

export default function FallbackLoader() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <calcite-loader scale="l" label={""}></calcite-loader>
    </div>
  );
}
