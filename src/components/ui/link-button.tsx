import { type VariantProps } from "class-variance-authority";
import { type ComponentProps, type ReactNode } from "react";

import { Button, buttonVariants } from "./button";

export interface LinkButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
  size?: ComponentProps<typeof Button>["size"];
}

export function LinkButton({
  href,
  onClick,
  children,
  variant = "default",
  icon,
  iconRight,
  size = "lg",
}: LinkButtonProps) {
  if (href) {
    return (
      <Button variant={variant} size={size} render={<a href={href} />} nativeButton={false}>{icon}{children}{iconRight}</Button>
    );
  }
  return (
    <Button variant={variant} size={size} onClick={onClick}>{icon}{children}{iconRight}</Button>
  );
}
