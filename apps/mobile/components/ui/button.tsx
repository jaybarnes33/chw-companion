import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Pressable, type PressableProps } from "react-native";

const buttonVariants = cva(
  "group flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "border-2 border-primary bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-touch px-5",
        sm: "h-10 px-4",
        lg: "h-14 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva(
  "font-body-bold text-sm uppercase tracking-widest",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-primary",
        ghost: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children?: React.ReactNode;
  };

function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant })}>
      <Pressable
        className={cn(buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
