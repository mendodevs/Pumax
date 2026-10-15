import { View, Text } from "react-native";
import type { Notice } from "../hooks/useNotice";

const STYLES: Record<Notice["kind"], string> = {
  success: "bg-brand-500/15 border-brand-500",
  error: "bg-red-500/15 border-red-500",
  info: "bg-slate-700 border-slate-600",
};

export default function NoticeBanner({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <View className={`rounded-xl px-4 py-3 mb-4 border ${STYLES[notice.kind]}`}>
      <Text className="text-ink">{notice.text}</Text>
    </View>
  );
}
