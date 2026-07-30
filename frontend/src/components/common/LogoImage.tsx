type LogoImageProps = {
  className?: string;
  alt?: string;
  eager?: boolean;
};

export function LogoImage({ className, alt = 'VPT Code Arena', eager = false }: LogoImageProps) {
  return (
    <picture>
      <source srcSet="/logocty.webp" type="image/webp" />
      <img
        src="/logocty.png"
        alt={alt}
        width="260"
        height="135"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        className={className}
      />
    </picture>
  );
}
