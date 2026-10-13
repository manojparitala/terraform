"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/forms";

/**
 * Submits a form to a server action without React's automatic form reset, so
 * what the user typed survives a validation error. The clicked submit button's
 * name and value are included in the submitted data.
 */
export function useFormAction(action: (state: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, isPending] = useActionState(action, undefined);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  }

  return { state, isPending, onSubmit };
}
