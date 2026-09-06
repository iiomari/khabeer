import { Clock, HelpCircle, Quote, Sparkles, Target, Wallet, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/category-icon";
import { formatMinutes, formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export type Brief = {
  rawText: string;
  categoryName: string | null;
  categoryIcon: string | null;
  reframedQuestion: string;
  keySkills: string[];
  questionsToAsk: string[];
  suggestedMinutes: number;
  budgetMinSar: number;
  budgetMaxSar: number;
  engine: string;
};

export function BriefCard({ brief }: { brief: Brief }) {
  const facts = [
    {
      icon: Clock,
      label: t.match.suggestedDuration,
      value: formatMinutes(brief.suggestedMinutes),
    },
    {
      icon: Wallet,
      label: t.match.fairBudget,
      value: `${formatNumber(brief.budgetMinSar)} – ${formatNumber(brief.budgetMaxSar)} ريال`,
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-brand-soft/50 px-5 py-3.5">
        <span className="inline-flex items-center gap-2 font-semibold">
          <Sparkles className="size-4.5 text-accent" />
          {t.match.resultTitle}
        </span>
        <Badge variant="secondary" className="gap-1.5 font-normal" title={t.match.engineHint}>
          {brief.engine === "claude" ? t.match.engineClaude : t.match.engineHeuristic}
        </Badge>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t.match.field}</span>
          {brief.categoryName ? (
            <Badge className="gap-1.5 px-3 py-1 text-sm">
              <CategoryIcon name={brief.categoryIcon} className="size-3.5" />
              {brief.categoryName}
            </Badge>
          ) : (
            <Badge variant="outline">{t.match.noField}</Badge>
          )}
        </div>

        <div className="rounded-xl border-e-4 border-e-primary bg-muted/40 p-4">
          <h3 className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Target className="size-4" />
            {t.match.realQuestion}
          </h3>
          <p className="text-base leading-relaxed font-medium">{brief.reframedQuestion}</p>
        </div>

        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Wrench className="size-4" />
            {t.match.neededSkills}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {brief.keySkills.map((skill) => (
              <li key={skill}>
                <Badge variant="outline" className="px-3 py-1 text-sm font-normal">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-3 rounded-xl border p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                <fact.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="truncate font-semibold">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <Separator />

        <div>
          <h3 className="inline-flex items-center gap-1.5 font-semibold">
            <HelpCircle className="size-4.5 text-accent" />
            {t.match.askThese}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.match.askTheseHint}</p>
          <ol className="mt-3 space-y-2.5">
            {brief.questionsToAsk.map((question, index) => (
              <li key={question} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-primary">
                  {formatNumber(index + 1)}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Quote className="size-4" />
            {t.match.yourWords}
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {brief.rawText}
          </p>
        </div>
      </div>
    </Card>
  );
}
