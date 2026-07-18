import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as React from "react";
import {
  Pressable,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from "react-native";

export type InputProps = RNTextInputProps & {
  className?: string;
  invalid?: boolean;
};

function Input({ className, invalid, ...props }: InputProps) {
  return (
    <RNTextInput
      className={cn(
        "h-touch border-2 border-input bg-shea px-4 font-body text-base text-indigo-ink",
        "placeholder:text-muted-foreground",
        invalid && "border-ember",
        className
      )}
      placeholderTextColor="#46464d"
      {...props}
    />
  );
}

export type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <View className={cn("gap-2", className)}>
      <Text className="font-body-bold text-[11px] uppercase tracking-[1.5px] text-indigo-ink">
        {label}
        {required ? " *" : ""}
      </Text>
      {children}
      {error ? (
        <Text className="font-body text-sm text-ember">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-sm text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
  invalid?: boolean;
};

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  invalid,
}: SegmentedControlProps<T>) {
  return (
    <View
      className={cn(
        "flex-row border-2 border-input",
        invalid && "border-ember",
        className
      )}
    >
      {options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            className={cn(
              "flex-1",
              i > 0 && "border-l-2 border-input",
              selected && "bg-indigo-ink"
            )}
            onPress={() => onChange(opt.value)}
          >
            <Text
              className={cn(
                "py-4 text-center font-body-bold text-sm",
                selected ? "text-shea" : "text-indigo-ink"
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { FormField, Input, SegmentedControl };
