export default function Loader({ label = "Loading curator..." }) {
  return (
    <div className="loader-block" role="status">
      <div className="loader-spinner" />
      <span>{label}</span>
    </div>
  );
}
