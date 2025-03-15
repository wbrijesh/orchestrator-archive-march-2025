const SessionLivePlayer = ({ url, readOnly }) => {
  return (
    <iframe
      src={url}
      sandbox="allow-same-origin allow-scripts"
      allow="clipboard-read; clipboard-write"
      className="w-full aspect-video"
      style={{ pointerEvents: readOnly ? "none" : "auto" }}
    />
  );
};

export default SessionLivePlayer;
