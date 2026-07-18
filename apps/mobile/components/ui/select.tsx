import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@rn-primitives/select";
import { MaterialIcons } from "@expo/vector-icons";
import * as React from "react";
import { Platform, StyleSheet } from "react-native";

type Option = SelectPrimitive.Option;

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  ref,
  className,
  children,
  ...props
}: SelectPrimitive.TriggerProps & {
  ref?: React.Ref<SelectPrimitive.TriggerRef>;
  children?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "h-touch flex-row items-center justify-between border-2 border-input bg-shea px-4",
        props.disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  portalHost,
  ...props
}: SelectPrimitive.ContentProps & {
  ref?: React.Ref<SelectPrimitive.ContentRef>;
  className?: string;
  portalHost?: string;
}) {
  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay
        className="z-40"
        closeOnPress
        style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}
      >
        <SelectPrimitive.Content
          className={cn(
            "z-50 max-h-96 min-w-[18rem] border-2 border-indigo-ink bg-shea py-1",
            className
          )}
          position={position}
          sideOffset={6}
          {...props}
        >
          <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.LabelProps & {
  ref?: React.Ref<SelectPrimitive.LabelRef>;
}) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "px-4 py-2 font-utility text-[11px] uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.ItemProps & {
  ref?: React.Ref<SelectPrimitive.ItemRef>;
  children?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "min-h-touch w-full flex-row items-center gap-3 px-4 py-3 active:bg-muted",
        props.disabled && "opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator>
        <MaterialIcons name="check" size={18} color="#a0410f" />
      </SelectPrimitive.ItemIndicator>
      {typeof children === "string" ? (
        <Text className="flex-1 text-base text-indigo-ink">{children}</Text>
      ) : (
        children
      )}
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.SeparatorProps & {
  ref?: React.Ref<SelectPrimitive.SeparatorRef>;
}) {
  return (
    <SelectPrimitive.Separator
      className={cn("h-px bg-indigo-ink/10", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type Option,
};
