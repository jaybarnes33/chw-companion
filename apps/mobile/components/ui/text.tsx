import { cn } from "@/lib/utils";
import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export const TextClassContext = React.createContext<string | undefined>(undefined);

export type TextProps = RNTextProps & {
  className?: string;
};

function Text({ className, ...props }: TextProps) {
  const textClass = React.use(TextClassContext);
  return (
    <RNText
      className={cn("font-body text-base text-foreground", textClass, className)}
      {...props}
    />
  );
}

export { Text };
