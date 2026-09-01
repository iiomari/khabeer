import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";

type Testimonial = {
  id: string;
  rating: number;
  comment: string;
  client: { id: string; name: string; avatarUrl: string | null; clientProfile: { companyName: string | null } | null };
  expert: { id: string; name: string; expertProfile: { headline: string | null } | null };
};

export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.id} className="fade-up" style={{ animationDelay: `${index * 90}ms` }}>
          <Card className="h-full gap-4 p-6">
            <Quote className="size-7 text-accent/60" aria-hidden="true" />
            <p className="flex-1 leading-loose text-foreground/90">{item.comment}</p>
            <RatingStars rating={item.rating} showValue={false} />
            <div className="flex items-center gap-3 border-t pt-4">
              <UserAvatar
                name={item.client.name}
                src={item.client.avatarUrl}
                seed={item.client.id}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.client.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.client.clientProfile?.companyName ?? "عميل"} · استشارة مع {item.expert.name}
                </p>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
