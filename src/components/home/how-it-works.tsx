"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n/ar";

function Steps({ steps }: { steps: readonly { readonly title: string; readonly body: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Card className="h-full gap-3 p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-lg font-bold text-primary">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks() {
  return (
    <Tabs defaultValue="client" className="w-full gap-6">
      <TabsList className="mx-auto h-11">
        <TabsTrigger value="client" className="px-5 text-sm">
          {t.home.howClientTab}
        </TabsTrigger>
        <TabsTrigger value="expert" className="px-5 text-sm">
          {t.home.howExpertTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="client">
        <Steps steps={t.home.howClient} />
      </TabsContent>
      <TabsContent value="expert">
        <Steps steps={t.home.howExpert} />
      </TabsContent>
    </Tabs>
  );
}
