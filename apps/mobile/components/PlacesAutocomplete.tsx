import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  type Option,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  formatNorthernGhanaPlace,
  searchNorthernGhanaPlaces,
  type NorthernGhanaPlace,
} from "@chw/content";
import type { TriggerRef } from "@rn-primitives/select";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PlacesAutocompleteProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSelectPlace?: (place: NorthernGhanaPlace) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
};

export function PlacesAutocomplete({
  value,
  onChangeText,
  onSelectPlace,
  placeholder = "Start typing a community…",
  invalid,
  className,
}: PlacesAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef<TriggerRef>(null);
  const safeArea = useSafeAreaInsets();

  const suggestions = useMemo(
    () => searchNorthernGhanaPlaces(value, 8),
    [value]
  );

  const hasConfirmedSelection = selectedLabel != null && value === selectedLabel;
  const showNoMatch =
    focused &&
    !open &&
    !hasConfirmedSelection &&
    value.trim().length >= 2 &&
    suggestions.length === 0;

  function selectPlace(place: NorthernGhanaPlace) {
    const label = formatNorthernGhanaPlace(place);
    setSelectedLabel(label);
    onChangeText(label);
    onSelectPlace?.(place);
    setOpen(false);
    setFocused(false);
  }

  function handleValueChange(option: Option) {
    if (!option) return;
    const place = suggestions.find(
      (candidate) => formatNorthernGhanaPlace(candidate) === option.value
    );
    if (place) selectPlace(place);
  }

  const contentInsets = {
    top: safeArea.top + 12,
    bottom: safeArea.bottom + (Platform.OS === "android" ? 24 : 12),
    left: 12,
    right: 12,
  };

  return (
    <View className={cn("z-10", className)}>
      <Select onOpenChange={setOpen} onValueChange={handleValueChange}>
        <SelectTrigger
          ref={triggerRef}
          className="relative w-full border-0 bg-transparent p-0"
          onLayout={(event) => setTriggerWidth(event.nativeEvent.layout.width)}
          onTouchStart={() => triggerRef.current?.open()}
        >
          <Input
            className="flex-1 pr-12"
            value={value}
            onChangeText={(next) => {
              setSelectedLabel(null);
              onChangeText(next);
              setOpen(next.trim().length > 0);
              if (next.trim()) triggerRef.current?.open();
            }}
            onFocus={() => {
              setFocused(true);
              if (value.trim() && !hasConfirmedSelection) {
                setOpen(true);
                triggerRef.current?.open();
              }
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            invalid={invalid}
          />
          <View
            pointerEvents="none"
            className="absolute bottom-0 right-0 top-0 w-12 items-center justify-center"
          >
            <MaterialIcons
              name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color="#46464d"
            />
          </View>
        </SelectTrigger>

        {suggestions.length > 0 ? (
          <SelectContent
            insets={contentInsets}
            align="start"
            side="bottom"
            style={triggerWidth ? { width: triggerWidth } : undefined}
          >
            <SelectGroup>
              <SelectLabel>Communities in Northern Ghana</SelectLabel>
              {suggestions.map((place, index) => {
                const label = formatNorthernGhanaPlace(place);
                return (
                  <View key={`${place.name}-${place.district}-${place.region}`}>
                    {index > 0 ? <SelectSeparator /> : null}
                    <SelectItem label={label} value={label}>
                      <View className="flex-1">
                        <Text className="font-body-bold text-base text-indigo-ink">
                          {place.name}
                        </Text>
                        <Text className="mt-0.5 font-utility text-[11px] uppercase tracking-wider text-muted-foreground">
                          {place.district} · {place.region}
                        </Text>
                      </View>
                    </SelectItem>
                  </View>
                );
              })}
            </SelectGroup>
          </SelectContent>
        ) : null}
      </Select>

      {showNoMatch ? (
        <Text className="mt-2 font-body text-sm text-muted-foreground">
          No match in Northern Ghana list — you can still save this name.
        </Text>
      ) : null}
    </View>
  );
}
