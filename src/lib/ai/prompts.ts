import type { CandidateRef, CategoryRef, ProblemBrief } from "./provider";

/**
 * The prompts live here rather than inside one provider, so every provider sends
 * the same instructions. Once two providers drift apart in wording, comparing
 * their output stops telling you anything about the models themselves.
 */

export const ANALYZE_SYSTEM = `أنت مستشار أعمال سعودي خبير. يصف لك صاحب منشأة مشكلته بلغته العادية، ومهمتك تحويلها إلى ملخص استشاري دقيق.

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

export const RANK_SYSTEM = `أنت تطابق مشكلة عمل مع خبراء متقاعدين. أمامك قائمة مرشحين مُصفّاة مسبقًا.

أعد JSON فقط بهذا الشكل:
{ "matches": [ { "expertId": "<id من القائمة حرفيًا>", "reason": "<جملة عربية واحدة تربط خلفية هذا الخبير تحديدًا بالمشكلة>", "score": <0-100> } ] }

قواعد:
- أعد ثلاثة مرشحين فقط، الأفضل أولًا.
- استخدم expertId كما ورد حرفيًا. ممنوع اختراع معرّفات.
- السبب يجب أن يذكر شيئًا حقيقيًا من خلفية الخبير (منصبه السابق، جهته، سنوات خبرته، مهارة بعينها) ويربطه بتفصيل من المشكلة. لا عبارات عامة مثل "خبير ممتاز".
- السبب جملة واحدة لا تتجاوز ٢٠ كلمة.
- لا يوجد لدينا جنس الخبير، فتجنّب الضمائر المذكرة أو المؤنثة تمامًا.`;

export const ASSISTANT_SYSTEM = `أنت «مساعد خبير»، مساعد دعم داخل منصة استشارات سعودية. تخاطب مستخدمًا كثير منهم متقاعدون، فاجعل كلامك بسيطًا وواضحًا.

قواعد صارمة:
- أجب بالعربية فقط، وبجملتين إلى أربع جمل كحد أقصى. لا قوائم طويلة ولا مقدمات.
- اعتمد حصريًا على «معلومات المنصة» و«بيانات حساب المستخدم» المعطاة لك.
- ممنوع منعًا باتًا اختراع رقم أو حالة أو موعد. إن لم تكن المعلومة أمامك، قل ذلك بوضوح ووجّهه إلى الصفحة المناسبة.
- لا تتحدث عن مستخدمين آخرين ولا عن بياناتهم إطلاقًا.
- إن كان السؤال خارج نطاق المنصة، اعتذر بلطف في سطر واحد ووجّهه إلى الدعم.
- نبرة مهنية ودودة بلا مبالغة ولا عبارات تسويقية.`;

/** Renders the category catalogue plus the raw problem text. */
export function buildAnalyzeUser(input: {
  text: string;
  categories: CategoryRef[];
  priceHints: Record<string, number>;
}): string {
  const catalogue = input.categories
    .map((category) => {
      const hint = input.priceHints[category.slug];
      return `- ${category.slug}: ${category.name}${hint ? ` (متوسط سعر الساعة ~${hint} ر.س)` : ""}`;
    })
    .join("\n");

  return `المجالات المتاحة:\n${catalogue}\n\nنص المشكلة كما كتبها العميل:\n"""\n${input.text}\n"""`;
}

/** Renders the shortlist the model is allowed to choose from — and only that. */
export function buildRankUser(input: {
  brief: Omit<ProblemBrief, "engine">;
  problemText: string;
  candidates: CandidateRef[];
}): string {
  const roster = input.candidates
    .map((candidate) =>
      [
        `id: ${candidate.id}`,
        `الاسم: ${candidate.name}`,
        `المنصب السابق: ${candidate.previousTitle ?? "—"}${
          candidate.previousOrganization ? ` — ${candidate.previousOrganization}` : ""
        }`,
        `سنوات الخبرة: ${candidate.yearsOfExperience}`,
        `العنوان: ${candidate.headline ?? "—"}`,
        `المجالات: ${candidate.categories.join("، ") || "—"}`,
        `المهارات: ${candidate.skills.join("، ") || "—"}`,
        `المدينة: ${candidate.city ?? "—"} | التقييم: ${candidate.ratingAvg} | يبدأ من: ${
          candidate.minPriceSar ?? "—"
        } ر.س`,
      ].join("\n"),
    )
    .join("\n---\n");

  return [
    `المشكلة كما كتبها العميل:\n"""\n${input.problemText}\n"""`,
    `السؤال الحقيقي: ${input.brief.reframedQuestion}`,
    `المهارات المطلوبة: ${input.brief.keySkills.join("، ")}`,
    `\nالمرشحون:\n${roster}`,
  ].join("\n");
}
