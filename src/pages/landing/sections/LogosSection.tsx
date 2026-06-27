import { ReactNode } from "react";


import Figma from "@/components/shared/logos/figma";
import React from "@/components/shared/logos/react";
import ShadcnUi from "@/components/shared/logos/shadcn-ui";
import Tailwind from "@/components/shared/logos/tailwind";
import TypeScript from "@/components/shared/logos/typescript";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/ui/logo";
import { Section } from "@/components/ui/section";

interface LogosProps {
  title?: string;
  badge?: ReactNode | false;
  logos?: ReactNode[] | false;
  className?: string;
}

export default function Logos({
  title = "Built with industry-standard tools and best practices",
  badge = (
    <Badge variant="outline" className="border-brand/30 text-brand">
      Last updated: 1000
    </Badge>
  ),
  logos = [
    <Logo key="figma" image={Figma} name="Figma" />,
    <Logo key="react" image={React} name="React" version="19.2.4" />,
    <Logo
      key="typescript"
      image={TypeScript}
      name="TypeScript"
      version="5.9.3"
    />,
    <Logo key="shadcn" image={ShadcnUi} name="Shadcn/ui" version="4.0.5" />,
    <Logo key="tailwind" image={Tailwind} name="Tailwind" version="4.2.1" />,
  ],
  className,
}: LogosProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          {badge !== false && badge}
          <h2 className="text-md font-semibold sm:text-2xl">{title}</h2>
        </div>
        {logos !== false && logos.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos}
          </div>
        )}
      </div>
    </Section>
  );
}
