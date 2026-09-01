import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { avatarGradient } from "@/lib/avatar";

export function UserAvatar({
  name,
  src,
  seed,
  className,
}: {
  name: string;
  src?: string | null;
  /** Stable identity for the generated gradient; defaults to the name. */
  seed?: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-10 ring-1 ring-black/5", className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundImage: avatarGradient(seed ?? name) }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
