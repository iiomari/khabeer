import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  problemBriefSchema,
  rankedMatchSchema,
  type AiProvider,
  type CandidateRef,
  type CategoryRef,
  type ProblemBrief,
  type RankedMatch,
} from "./provider";

const MODEL = "claude-opus-5";

/** Pulls the first JSON object out of a reply, tolerating stray prose or code fences. */
function parseJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model reply");
  return JSON.parse(candidate.slice(start, end + 1));
}

const ANALYZE_SYSTEM = `أنت مستشار أعمال سعودي خبير. يصف لك صاحب منشأة مشكلته بلغته العادية، ومهمتك تحويلها إلى ملخص استشاري دقيق.

أعد JSON فقط بلا أي نص آخر، بهذا الشكل:
{
  "categorySlug": "<slug من القائمة المعطاة، أو null إذا لم يناسب أي منها>",
  "reframedQuestion": "<السؤال الحقيقي الذي يجب أن يجيب عنه الخبير — لا تكرر كلام العميل، بل صُغ ما يحتاج فعلًا معرفته>",
  "keySkills": ["<٣ إلى ٥ مهارات محددة يحتاجها من يحل هذه المشكلة>"],
  "questionsToAsk": ["<٤ أسئلة محددة يجب أن يطرحها العميل على الخبير في بداية الاستشارة، مبنية على تفاصيل حالته لا عامة>"],
  "suggestedMinutes": 30 أو 45 أو 60 أو 90,
  "budgetMinSar": <رقم صحيح>,
  "budgetMaxSar": <رقم صحيح أكبر من الأدنى>
}

قواعد:
- بالعربية الفصحى المهنية، بلا مبالغة ولا حشو.
- الميزانية بالريال السعودي لجلسة واحدة، واسترشد بمتوسط السوق المعطى لكل مجال.
- الأسئلة يجب أن تكون مخصصة لحالته هو: اذكر الأرقام والتفاصيل التي ذكرها.
- إذا كان النص غامضًا أو بلا معنى، اختر categorySlug = null وصُغ سؤالًا يطلب توضيحًا.`;

const RANK_SYSTEM = `أنت تطابق مشكلة عمل مع خبراء متقاعدين. أمامك قائمة مرشحين مُصفّاة مسبقًا.

أعد JSON فقط بهذا الشكل:
{ "matches": [ { "expertId": "<id من القائمة حرفيًا>", "reason": "<جملة عربية واحدة تربط خلفية هذا الخبير تحديدًا بالمشكلة>", "score": <0-100> } ] }

قواعد:
- أعد ثلاثة مرشحين فقط، الأفضل أولًا.
- استخدم expertId كما ورد حرفيًا. ممنوع اختراع معرّفات.
- السبب يجب أن يذكر شيئًا حقيقيًا من خلفية الخبير (منصبه السابق، جهته، سنوات خبرته، مهارة بعينها) ويربطه بتفصيل من المشكلة. لا عبارات عامة مثل "خبير ممتاز".
- السبب جملة واحدة لا تتجاوز ٢٠ كلمة.
- لا يوجد لدينا جنس الخبير، فتجنّب الضمائر المذكرة أو المؤنثة تمامًا.`;

async function complete(
  client: Anthropic,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

export class AnthropicAiProvider implements AiProvider {
  readonly name = "claude" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 1 });
  }

  async analyzeProblem(input: {
    text: string;
    categories: CategoryRef[];
    priceHints: Record<string, number>;
  }): Promise<Omit<ProblemBrief, "engine">> {
    const catalogue = input.categories
      .map((category) => {
        const hint = input.priceHints[category.slug];
        return `- ${category.slug}: ${category.name}${hint ? ` (متوسط سعر الساعة ~${hint} ر.س)` : ""}`;
      })
      .join("\n");

    const reply = await complete(
      this.client,
      ANALYZE_SYSTEM,
      `المجالات المتاحة:\n${catalogue}\n\nنص المشكلة كما كتبها العميل:\n"""\n${input.text}\n"""`,
      1200,
    );

    const brief = problemBriefSchema.parse(parseJson(reply));
    const allowed = new Set(input.categories.map((category) => category.slug));

    return {
      ...brief,
      categorySlug: brief.categorySlug && allowed.has(brief.categorySlug) ? brief.categorySlug : null,
      budgetMaxSar: Math.max(brief.budgetMaxSar, brief.budgetMinSar + 100),
    };
  }

  async rankExperts(input: {
    brief: Omit<ProblemBrief, "engine">;
    problemText: string;
    candidates: CandidateRef[];
  }): Promise<RankedMatch[]> {
    const roster = input.candidates
      .map((candidate) =>
        [
          `id: ${candidate.id}`,
          `الاسم: ${candidate.name}`,
          `المنصب السابق: ${candidate.previousTitle ?? "—"}${candidate.previousOrganization ? ` — ${candidate.previousOrganization}` : ""}`,
          `سنوات الخبرة: ${candidate.yearsOfExperience}`,
          `العنوان: ${candidate.headline ?? "—"}`,
          `المجالات: ${candidate.categories.join("، ") || "—"}`,
          `المهارات: ${candidate.skills.join("، ") || "—"}`,
          `المدينة: ${candidate.city ?? "—"} | التقييم: ${candidate.ratingAvg} | يبدأ من: ${candidate.minPriceSar ?? "—"} ر.س`,
        ].join("\n"),
      )
      .join("\n---\n");

    const reply = await complete(
      this.client,
      RANK_SYSTEM,
      [
        `المشكلة كما كتبها العميل:\n"""\n${input.problemText}\n"""`,
        `السؤال الحقيقي: ${input.brief.reframedQuestion}`,
        `المهارات المطلوبة: ${input.brief.keySkills.join("، ")}`,
        `\nالمرشحون:\n${roster}`,
      ].join("\n"),
      1200,
    );

    const parsed = z
      .object({ matches: z.array(rankedMatchSchema).min(1) })
      .parse(parseJson(reply));

    const allowed = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
    const matches = parsed.matches.filter((match) => allowed.has(match.expertId)).slice(0, 3);

    // A reply that invented ids is not a partial success — fall back to the deterministic order.
    if (matches.length < Math.min(3, input.candidates.length)) {
      throw new Error("model returned unknown expert ids");
    }

    return matches;
  }
}

const ASSISTANT_SYSTEM = `أنت «مساعد خبير»، مساعد دعم داخل منصة استشارات سعودية. تخاطب مستخدمًا كثير منهم متقاعدون، فاجعل كلامك بسيطًا وواضحًا.

قواعد صارمة:
- أجب بالعربية فقط، وبجملتين إلى أربع جمل كحد أقصى. لا قوائم طويلة ولا مقدمات.
- اعتمد حصريًا على «معلومات المنصة» و«بيانات حساب المستخدم» المعطاة لك.
- ممنوع منعًا باتًا اختراع رقم أو حالة أو موعد. إن لم تكن المعلومة أمامك، قل ذلك بوضوح ووجّهه إلى الصفحة المناسبة.
- لا تتحدث عن مستخدمين آخرين ولا عن بياناتهم إطلاقًا.
- إن كان السؤال خارج نطاق المنصة، اعتذر بلطف في سطر واحد ووجّهه إلى الدعم.
- نبرة مهنية ودودة بلا مبالغة ولا عبارات تسويقية.`;

/** Answers a support question from platform facts plus the user's own data. */
export async function answerAssistant(input: {
  apiKey: string;
  question: string;
  platformBrief: string;
  accountContext: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const client = new Anthropic({ apiKey: input.apiKey, maxRetries: 1 });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [
      ASSISTANT_SYSTEM,
      `\n\n### معلومات المنصة\n${input.platformBrief}`,
      `\n\n### بيانات حساب المستخدم الحالي\n${input.accountContext}`,
    ].join(""),
    messages: [
      ...input.history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: input.question },
    ],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}
