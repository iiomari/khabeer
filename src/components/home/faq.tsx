import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { t } from "@/lib/i18n/ar";

export function Faq() {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
      {t.home.faq.map((item, index) => (
        <AccordionItem key={item.q} value={`faq-${index}`}>
          <AccordionTrigger className="text-start text-base font-semibold">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-base leading-loose text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
