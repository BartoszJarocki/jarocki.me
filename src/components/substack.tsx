interface Props {
  embedUrl: string;
}

export const Substack = ({ embedUrl }: Props) => {
  return (
    <div className="mt-16 border border-zinc-300 rounded overflow-hidden">
      <iframe
        src={embedUrl}
        style={{
          width: '100%',
          backgroundColor: 'gray',
        }}
        className="w-full"
        height="320"
        frameBorder="0"
        scrolling="no"
      />
    </div>
  );
};
