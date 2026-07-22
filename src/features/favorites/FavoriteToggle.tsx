import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  addFavorite,
  isFavorited,
  listFavorites,
  removeFavorite,
  type FavoriteContentType,
} from "@/features/favorites/api";
import { env } from "@/lib/env";

type FavoriteToggleProps = {
  type: FavoriteContentType;
  contentId: string;
  compact?: boolean;
};

export function FavoriteToggle({ type, contentId, compact }: FavoriteToggleProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const useMock = env.useMockAdapter || auth.usingMock;

  const favQuery = useQuery({
    queryKey: ["favorite-one", auth.user?.id, type, contentId],
    enabled: Boolean(auth.user) && !useMock,
    queryFn: () => isFavorited(auth.user!.id, type, contentId),
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!auth.user) throw new Error("未登入");
      if (favQuery.data) {
        const all = await listFavorites(auth.user.id);
        const hit = all.find((f) => f.content_type === type && f.content_id === contentId);
        if (hit) await removeFavorite(hit.id);
      } else {
        await addFavorite(auth.user.id, type, contentId);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["favorite-one", auth.user?.id, type, contentId],
      });
      await queryClient.invalidateQueries({ queryKey: ["favorites", auth.user?.id] });
    },
  });

  if (useMock || !auth.user) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={favQuery.isLoading || toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      {favQuery.data ? (compact ? "已收藏" : "取消收藏") : compact ? "收藏" : "加入收藏"}
    </Button>
  );
}
