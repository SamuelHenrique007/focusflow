import { memo } from "react";
import { cn } from "@/lib/cn";
import { useAvatarStore } from "@/store/useAvatarStore";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const UserAvatar = memo(function UserAvatar({
  size = "md",
  className,
}: Props) {
  const avatar = useAvatarStore((state) => state.equippedAvatar);

  const sizes = {
    sm: "h-10 w-10 text-xl",
    md: "h-14 w-14 text-2xl",
    lg: "h-20 w-20 text-4xl",
  };

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full border border-violet-100 bg-violet-50 shadow-sm",
        sizes[size],
        className
      )}
    >
      {avatar}
    </div>
  );
});

export default UserAvatar;