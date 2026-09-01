"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, Rocket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addAvailabilityAction,
  addCertificationAction,
  addEducationAction,
  addExperienceAction,
  addSkillAction,
  deleteProfileItemAction,
  publishProfileAction,
  saveProfileBasicsAction,
  saveServiceAction,
} from "@/server/actions/expert-profile";
import { SAUDI_CITIES, WEEK_DAYS } from "@/lib/constants";
import { formatMinutes, formatNumber, formatSar, minutesToTimeLabel } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export type BuilderProfile = {
  headline: string | null;
  bio: string | null;
  previousTitle: string | null;
  previousOrganization: string | null;
  yearsOfExperience: number;
  city: string | null;
  verificationStatus: string;
  categories: { category: { id: string; name: string } }[];
  experiences: {
    id: string;
    organization: string;
    position: string;
    startYear: number;
    endYear: number | null;
    isCurrent: boolean;
  }[];
  educations: { id: string; institution: string; degree: string; graduationYear: number | null }[];
  certifications: { id: string; name: string; issuer: string; issueYear: number | null }[];
  skills: { id: string; name: string }[];
  services: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceSar: number;
  }[];
  availability: { id: string; dayOfWeek: number; startMinute: number; endMinute: number }[];
};

const STEPS = [
  { title: t.onboarding.step1, hint: t.onboarding.step1Hint },
  { title: t.onboarding.step2, hint: t.onboarding.step2Hint },
  { title: t.onboarding.step3, hint: t.onboarding.step3Hint },
  { title: t.onboarding.step4, hint: t.onboarding.step4Hint },
];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, index) => 7 * 60 + index * 30);

function ItemRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1 text-sm">{children}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive"
        onClick={onDelete}
        aria-label={t.common.delete}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

export function ProfileBuilder({
  profile,
  categories,
  initialStep,
}: {
  profile: BuilderProfile;
  categories: Category[];
  initialStep: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep - 1, 0), STEPS.length - 1));
  const [pending, startTransition] = useTransition();

  const [basics, setBasics] = useState({
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    previousTitle: profile.previousTitle ?? "",
    previousOrganization: profile.previousOrganization ?? "",
    yearsOfExperience: profile.yearsOfExperience ? String(profile.yearsOfExperience) : "",
    city: profile.city ?? "",
    categoryIds: profile.categories.map((item) => item.category.id),
  });

  const [experience, setExperience] = useState({
    organization: "",
    position: "",
    startYear: "",
    endYear: "",
    isCurrent: false,
    description: "",
  });
  const [education, setEducation] = useState({
    institution: "",
    degree: "",
    field: "",
    graduationYear: "",
  });
  const [certification, setCertification] = useState({ name: "", issuer: "", issueYear: "" });
  const [skill, setSkill] = useState("");
  const [service, setService] = useState({
    name: "",
    description: "",
    durationMinutes: "60",
    priceSar: "",
  });
  const [slot, setSlot] = useState({ dayOfWeek: "0", startMinute: "600", endMinute: "840" });

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(result.error ?? t.common.somethingWentWrong);
      }
    });
  }

  function saveBasics(then?: () => void) {
    run(
      () =>
        saveProfileBasicsAction({
          ...basics,
          yearsOfExperience: Number(basics.yearsOfExperience),
        }),
      () => {
        toast.success(t.onboarding.draftSaved);
        then?.();
      },
    );
  }

  function toggleCategory(id: string) {
    setBasics((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((item) => item !== id)
        : [...current.categoryIds, id],
    }));
  }

  function goNext() {
    if (step === 0) return saveBasics(() => setStep(1));
    if (step === 2 && profile.services.length === 0) return toast.error(t.onboarding.needService);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function publish() {
    run(
      () => publishProfileAction(),
      () => {
        toast.success(t.onboarding.published);
        router.push("/dashboard/expert");
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{STEPS[step].title}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[step].hint}</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {t.onboarding.stepOf(step + 1, STEPS.length)}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      <Card className="gap-6 p-6">
        {step === 0 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="headline">{t.onboarding.headline}</Label>
              <Input
                id="headline"
                value={basics.headline}
                onChange={(event) => setBasics({ ...basics, headline: event.target.value })}
                placeholder={t.onboarding.headlinePlaceholder}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t.onboarding.bio}</Label>
              <Textarea
                id="bio"
                value={basics.bio}
                onChange={(event) => setBasics({ ...basics, bio: event.target.value })}
                placeholder={t.onboarding.bioPlaceholder}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">{basics.bio.length} / 2000</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="previousTitle">{t.onboarding.previousTitle}</Label>
                <Input
                  id="previousTitle"
                  value={basics.previousTitle}
                  onChange={(event) =>
                    setBasics({ ...basics, previousTitle: event.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previousOrganization">{t.onboarding.previousOrganization}</Label>
                <Input
                  id="previousOrganization"
                  value={basics.previousOrganization}
                  onChange={(event) =>
                    setBasics({ ...basics, previousOrganization: event.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">{t.onboarding.yearsOfExperience}</Label>
                <Input
                  id="years"
                  inputMode="numeric"
                  value={basics.yearsOfExperience}
                  onChange={(event) =>
                    setBasics({
                      ...basics,
                      yearsOfExperience: event.target.value.replace(/\D/g, "").slice(0, 2),
                    })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="builder-city">{t.auth.city}</Label>
                <Select
                  value={basics.city || undefined}
                  onValueChange={(value) => setBasics({ ...basics, city: value })}
                >
                  <SelectTrigger id="builder-city" className="h-12 w-full">
                    <SelectValue placeholder={t.discovery.anyCity} />
                  </SelectTrigger>
                  <SelectContent>
                    {SAUDI_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t.onboarding.categories}</legend>
              <p className="text-xs text-muted-foreground">{t.onboarding.categoriesHint}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((category) => {
                  const selected = basics.categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-primary/40",
                      )}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="font-semibold">{t.expert.experiences}</h3>
              {profile.experiences.length > 0 ? (
                <ul className="space-y-2">
                  {profile.experiences.map((item) => (
                    <ItemRow
                      key={item.id}
                      onDelete={() => run(() => deleteProfileItemAction("experience", item.id))}
                    >
                      <span className="block font-medium">{item.position}</span>
                      <span className="block text-muted-foreground">
                        {item.organization} · {formatNumber(item.startYear)} —{" "}
                        {item.isCurrent ? t.common.present : formatNumber(item.endYear ?? 0)}
                      </span>
                    </ItemRow>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Input
                  placeholder={t.onboarding.position}
                  value={experience.position}
                  onChange={(event) =>
                    setExperience({ ...experience, position: event.target.value })
                  }
                />
                <Input
                  placeholder={t.onboarding.organization}
                  value={experience.organization}
                  onChange={(event) =>
                    setExperience({ ...experience, organization: event.target.value })
                  }
                />
                <Input
                  placeholder={t.onboarding.startYear}
                  inputMode="numeric"
                  value={experience.startYear}
                  onChange={(event) =>
                    setExperience({
                      ...experience,
                      startYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
                <Input
                  placeholder={t.onboarding.endYear}
                  inputMode="numeric"
                  disabled={experience.isCurrent}
                  value={experience.endYear}
                  onChange={(event) =>
                    setExperience({
                      ...experience,
                      endYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
                <Textarea
                  placeholder={t.onboarding.experienceDescription}
                  className="sm:col-span-2"
                  rows={2}
                  value={experience.description}
                  onChange={(event) =>
                    setExperience({ ...experience, description: event.target.value })
                  }
                />
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="isCurrent"
                    checked={experience.isCurrent}
                    onCheckedChange={(checked) =>
                      setExperience({ ...experience, isCurrent: checked === true })
                    }
                  />
                  <Label htmlFor="isCurrent" className="font-normal">
                    {t.onboarding.stillWorking}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 sm:col-span-2"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        addExperienceAction({
                          ...experience,
                          startYear: Number(experience.startYear),
                          endYear: experience.endYear ? Number(experience.endYear) : undefined,
                        }),
                      () =>
                        setExperience({
                          organization: "",
                          position: "",
                          startYear: "",
                          endYear: "",
                          isCurrent: false,
                          description: "",
                        }),
                    )
                  }
                >
                  <Plus className="size-4" />
                  {t.onboarding.addExperience}
                </Button>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold">{t.expert.education}</h3>
              {profile.educations.length > 0 ? (
                <ul className="space-y-2">
                  {profile.educations.map((item) => (
                    <ItemRow
                      key={item.id}
                      onDelete={() => run(() => deleteProfileItemAction("education", item.id))}
                    >
                      <span className="block font-medium">{item.degree}</span>
                      <span className="block text-muted-foreground">
                        {item.institution}
                        {item.graduationYear ? ` · ${formatNumber(item.graduationYear)}` : ""}
                      </span>
                    </ItemRow>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Input
                  placeholder={t.onboarding.degree}
                  value={education.degree}
                  onChange={(event) => setEducation({ ...education, degree: event.target.value })}
                />
                <Input
                  placeholder={t.onboarding.institution}
                  value={education.institution}
                  onChange={(event) =>
                    setEducation({ ...education, institution: event.target.value })
                  }
                />
                <Input
                  placeholder={t.onboarding.fieldOfStudy}
                  value={education.field}
                  onChange={(event) => setEducation({ ...education, field: event.target.value })}
                />
                <Input
                  placeholder={t.onboarding.graduationYear}
                  inputMode="numeric"
                  value={education.graduationYear}
                  onChange={(event) =>
                    setEducation({
                      ...education,
                      graduationYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 sm:col-span-2"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        addEducationAction({
                          ...education,
                          graduationYear: education.graduationYear
                            ? Number(education.graduationYear)
                            : undefined,
                        }),
                      () =>
                        setEducation({
                          institution: "",
                          degree: "",
                          field: "",
                          graduationYear: "",
                        }),
                    )
                  }
                >
                  <Plus className="size-4" />
                  {t.onboarding.addEducation}
                </Button>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold">{t.expert.certifications}</h3>
              {profile.certifications.length > 0 ? (
                <ul className="space-y-2">
                  {profile.certifications.map((item) => (
                    <ItemRow
                      key={item.id}
                      onDelete={() => run(() => deleteProfileItemAction("certification", item.id))}
                    >
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-muted-foreground">
                        {item.issuer}
                        {item.issueYear ? ` · ${formatNumber(item.issueYear)}` : ""}
                      </span>
                    </ItemRow>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Input
                  placeholder={t.onboarding.certificationName}
                  value={certification.name}
                  onChange={(event) =>
                    setCertification({ ...certification, name: event.target.value })
                  }
                />
                <Input
                  placeholder={t.onboarding.issuer}
                  value={certification.issuer}
                  onChange={(event) =>
                    setCertification({ ...certification, issuer: event.target.value })
                  }
                />
                <Input
                  placeholder={t.onboarding.issueYear}
                  inputMode="numeric"
                  value={certification.issueYear}
                  onChange={(event) =>
                    setCertification({
                      ...certification,
                      issueYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 sm:col-span-2"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        addCertificationAction({
                          ...certification,
                          issueYear: certification.issueYear
                            ? Number(certification.issueYear)
                            : undefined,
                        }),
                      () => setCertification({ name: "", issuer: "", issueYear: "" }),
                    )
                  }
                >
                  <Plus className="size-4" />
                  {t.onboarding.addCertification}
                </Button>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold">{t.expert.skills}</h3>
              <p className="text-sm text-muted-foreground">{t.onboarding.skillsHint}</p>
              {profile.skills.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.map((item) => (
                    <li key={item.id}>
                      <Badge variant="secondary" className="gap-1.5 py-1.5 ps-3 pe-1.5">
                        {item.name}
                        <button
                          type="button"
                          onClick={() => run(() => deleteProfileItemAction("skill", item.id))}
                          aria-label={`${t.common.delete} ${item.name}`}
                          className="rounded-full p-0.5 hover:bg-background/60"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex gap-2">
                <Input
                  placeholder={t.onboarding.skillName}
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      run(() => addSkillAction({ name: skill }), () => setSkill(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || skill.trim().length < 2}
                  onClick={() => run(() => addSkillAction({ name: skill }), () => setSkill(""))}
                >
                  <Plus className="size-4" />
                  {t.common.add}
                </Button>
              </div>
            </section>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            {profile.services.length > 0 ? (
              <ul className="space-y-2">
                {profile.services.map((item) => (
                  <ItemRow
                    key={item.id}
                    onDelete={() => run(() => deleteProfileItemAction("service", item.id))}
                  >
                    <span className="block font-medium">{item.name}</span>
                    <span className="block text-muted-foreground">{item.description}</span>
                    <span className="mt-1 block">
                      {formatMinutes(item.durationMinutes)} ·{" "}
                      <span className="font-semibold text-primary">{formatSar(item.priceSar)}</span>
                    </span>
                  </ItemRow>
                ))}
              </ul>
            ) : null}

            <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
              <Input
                placeholder={t.onboarding.serviceNamePlaceholder}
                className="sm:col-span-2"
                value={service.name}
                onChange={(event) => setService({ ...service, name: event.target.value })}
              />
              <Textarea
                placeholder={t.onboarding.serviceDescription}
                className="sm:col-span-2"
                rows={3}
                value={service.description}
                onChange={(event) => setService({ ...service, description: event.target.value })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs">
                  {t.onboarding.serviceDuration}
                </Label>
                <Select
                  value={service.durationMinutes}
                  onValueChange={(value) => setService({ ...service, durationMinutes: value })}
                >
                  <SelectTrigger id="duration" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {formatMinutes(minutes)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs">
                  {t.onboarding.servicePrice}
                </Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={service.priceSar}
                  onChange={(event) =>
                    setService({
                      ...service,
                      priceSar: event.target.value.replace(/\D/g, "").slice(0, 5),
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 sm:col-span-2"
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      saveServiceAction({
                        ...service,
                        durationMinutes: Number(service.durationMinutes),
                        priceSar: Number(service.priceSar),
                      }),
                    () =>
                      setService({
                        name: "",
                        description: "",
                        durationMinutes: "60",
                        priceSar: "",
                      }),
                  )
                }
              >
                <Plus className="size-4" />
                {t.onboarding.addService}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="font-semibold">{t.expert.availability}</h3>
              <p className="text-sm text-muted-foreground">{t.onboarding.availabilityHint}</p>

              {profile.availability.length > 0 ? (
                <ul className="space-y-2">
                  {profile.availability.map((item) => (
                    <ItemRow
                      key={item.id}
                      onDelete={() => run(() => deleteProfileItemAction("availability", item.id))}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium">{WEEK_DAYS[item.dayOfWeek].label}</span>
                        <span dir="ltr" className="text-muted-foreground">
                          {minutesToTimeLabel(item.startMinute)} —{" "}
                          {minutesToTimeLabel(item.endMinute)}
                        </span>
                      </span>
                    </ItemRow>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.onboarding.day}</Label>
                  <Select
                    value={slot.dayOfWeek}
                    onValueChange={(value) => setSlot({ ...slot, dayOfWeek: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEK_DAYS.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t.onboarding.fromTime}</Label>
                  <Select
                    value={slot.startMinute}
                    onValueChange={(value) => setSlot({ ...slot, startMinute: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {minutesToTimeLabel(minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t.onboarding.toTime}</Label>
                  <Select
                    value={slot.endMinute}
                    onValueChange={(value) => setSlot({ ...slot, endMinute: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {minutesToTimeLabel(minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 sm:col-span-3"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      addAvailabilityAction({
                        dayOfWeek: Number(slot.dayOfWeek),
                        startMinute: Number(slot.startMinute),
                        endMinute: Number(slot.endMinute),
                      }),
                    )
                  }
                >
                  <Plus className="size-4" />
                  {t.onboarding.addSlot}
                </Button>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold">{t.onboarding.preview}</h3>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">{basics.headline || "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {basics.previousTitle} — {basics.previousOrganization}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  <li>
                    <Badge variant="secondary">
                      {t.expert.experiences}: {formatNumber(profile.experiences.length)}
                    </Badge>
                  </li>
                  <li>
                    <Badge variant="secondary">
                      {t.expert.certifications}: {formatNumber(profile.certifications.length)}
                    </Badge>
                  </li>
                  <li>
                    <Badge variant="secondary">
                      {t.expert.services}: {formatNumber(profile.services.length)}
                    </Badge>
                  </li>
                  <li>
                    <Badge variant="secondary">
                      {t.expert.availability}: {formatNumber(profile.availability.length)}
                    </Badge>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">{t.onboarding.publishHint}</p>
              <Button size="lg" className="gap-2" onClick={publish} disabled={pending}>
                <Rocket className="size-4.5" />
                {t.onboarding.publish}
              </Button>
            </section>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t pt-5">
          <Button
            type="button"
            variant="ghost"
            className="gap-1"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || pending}
          >
            <ChevronRight className="size-4" />
            {t.common.previous}
          </Button>

          <div className="flex gap-2">
            {step === 0 ? (
              <Button type="button" variant="outline" onClick={() => saveBasics()} disabled={pending}>
                {t.onboarding.saveDraft}
              </Button>
            ) : null}

            {step < STEPS.length - 1 ? (
              <Button type="button" className="gap-1" onClick={goNext} disabled={pending}>
                {t.common.next}
                <ChevronLeft className="size-4" />
              </Button>
            ) : (
              <Button type="button" className="gap-1" onClick={publish} disabled={pending}>
                <Check className="size-4" />
                {t.onboarding.publish}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
