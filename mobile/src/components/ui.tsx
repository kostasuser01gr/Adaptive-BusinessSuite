import React, { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../app/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "ghost";
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  if (!scroll) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={[styles.screenContent, contentContainerStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function HeroCard({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={["#152347", "#0E1730"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
      {meta ? (
        <View style={{ marginTop: theme.spacing.md }}>{meta}</View>
      ) : null}
    </LinearGradient>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function StatCard({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const background =
    tone === "success"
      ? "rgba(86,211,155,0.14)"
      : tone === "warning"
        ? "rgba(245,184,69,0.14)"
        : tone === "danger"
          ? "rgba(255,110,110,0.14)"
          : theme.colors.primaryMuted;

  return (
    <View style={[styles.statCard, { backgroundColor: background }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const colorMap = {
    neutral: theme.colors.textMuted,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  };

  return (
    <View style={[styles.badge, { backgroundColor: `${colorMap[tone]}20` }]}>
      <Text style={[styles.badgeText, { color: colorMap[tone] }]}>{label}</Text>
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = "primary",
  style,
}: ButtonProps) {
  const variantStyles =
    variant === "secondary"
      ? { backgroundColor: theme.colors.chip, borderColor: theme.colors.border }
      : variant === "ghost"
        ? { backgroundColor: "transparent", borderColor: "transparent" }
        : {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          };

  const textColor = variant === "primary" ? "#06111D" : theme.colors.text;

  return (
    <Pressable onPress={onPress} style={[styles.button, variantStyles, style]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={textColor}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function AppInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      multiline={multiline}
      style={[
        styles.input,
        multiline ? styles.inputMultiline : undefined,
        style,
      ]}
    />
  );
}

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? {
              backgroundColor: theme.colors.primaryMuted,
              borderColor: theme.colors.primary,
            }
          : null,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active ? { color: theme.colors.primary } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel style={{ alignItems: "center", paddingVertical: theme.spacing.xl }}>
      <Ionicons name="sparkles" size={28} color={theme.colors.primary} />
      <Text style={[styles.sectionTitle, { marginTop: theme.spacing.sm }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionSubtitle,
          { textAlign: "center", marginTop: theme.spacing.sm },
        ]}
      >
        {description}
      </Text>
      {action ? (
        <View style={{ marginTop: theme.spacing.md }}>{action}</View>
      ) : null}
    </Panel>
  );
}

export function DetailRow({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {trailing}
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  heroCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.section,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
  statCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    minHeight: 92,
    justifyContent: "space-between",
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body,
  },
  inputMultiline: {
    minHeight: 112,
    paddingTop: theme.spacing.md,
    textAlignVertical: "top",
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    marginBottom: 4,
  },
  rowValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
});
