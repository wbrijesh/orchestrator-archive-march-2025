const TestPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-5">
      <video
        className="w-full h-full rounded-xl"
        src="https://orchestrator.company/demo-1.mp4"
        controls
        autoPlay={false}
      />
    </div>
  );
};

export default TestPage;
