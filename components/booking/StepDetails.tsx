"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Checkbox, Honeypot, Input, Textarea } from "@/components/ui/Input";
import { customerSchema, type CustomerForm } from "@/lib/validation";

export type StepDetailsHandle = { getValues: () => CustomerForm };

export const StepDetails = forwardRef<StepDetailsHandle, { defaultValues: CustomerForm; onSubmit: (v: CustomerForm) => void }>(
  function StepDetails({ defaultValues, onSubmit }, ref) {
    const {
      register,
      handleSubmit,
      getValues,
      watch,
      formState: { errors },
    } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues, mode: "onTouched" });
    useImperativeHandle(ref, () => ({ getValues }), [getValues]);
    const noteLen = watch("note")?.length ?? 0;

    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
        <Honeypot {...register("website")} />
        <Input label="Ime i prezime" required autoComplete="name" placeholder="npr. Jelena Marković" error={errors.name?.message} {...register("name")} />
        <Input
          label="Broj mobilnog telefona"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="065 123 4567"
          hint="Na ovaj broj šaljemo potvrdu i podsetnik."
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Email (opciono)"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ime@primer.com"
          hint="Ako unesete email, poslaćemo Vam i potvrdu sa detaljima termina."
          error={errors.email?.message}
          {...register("email")}
        />
        <Textarea
          label="Napomena (opciono)"
          maxLength={300}
          placeholder="Npr. dužina kose, željeni model, alergije…"
          hint={`${noteLen}/300 karaktera`}
          error={errors.note?.message}
          {...register("note")}
        />
        <Checkbox label="Želim da primim potvrdu i podsetnik putem Vibera/SMS-a" {...register("optIn")} />
        <div className="pt-2">
          <Button type="submit" size="lg" fullWidth>
            Dalje na pregled <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </form>
    );
  },
);
