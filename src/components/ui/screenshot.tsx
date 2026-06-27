import { cn } from "@/lib/utils";

interface ScreenshotProps {
  srcLight: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function Screenshot({
  srcLight,
  srcDark,
  alt,
  width,
  height,
  className,
}: ScreenshotProps) {
  return (
    <>
      <img
        src={srcLight}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    </>
  );
}
