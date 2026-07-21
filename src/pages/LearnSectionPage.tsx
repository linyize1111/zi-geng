import { useParams } from "react-router-dom";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

const titles = {
  vocabulary: "詞彙",
  quotes: "名言",
  craft: "寫作技巧",
} as const;

export default function LearnSectionPage({ kind }: { kind: keyof typeof titles }) {
  const { id } = useParams();
  return (
    <PlaceholderPage
      title={id ? `${titles[kind]}詳情` : titles[kind]}
      description={id ? `內容 ID：${id}` : "列表與搜尋將於 Phase 3 完成。"}
    />
  );
}
