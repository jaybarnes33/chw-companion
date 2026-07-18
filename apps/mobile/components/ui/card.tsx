import { Text, type TextProps } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { View, type ViewProps } from "react-native";

function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("border border-border bg-card p-5", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("gap-1.5", className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: TextProps) {
  return (
    <Text
      className={cn("font-headline text-xl text-card-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("pt-4", className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
