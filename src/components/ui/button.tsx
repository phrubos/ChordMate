"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Loader2 } from "lucide-react"
import { type VariantProps } from "class-variance-authority"

import { buttonVariants } from "./button-variants"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  ...props
}: ButtonProps) {
  if (isLoading) {
    // The label crossfades out (blur + scale .96) and a spinner takes its place; the width stays put.
    return (
      <ButtonPrimitive
        data-slot="button"
        {...props}
        className={cn(buttonVariants({ variant, size, className }), "relative !pointer-events-auto")}
        aria-disabled={true}
        aria-busy={true}
        // After {...props}: a loading button must not run the caller's onClick a second time.
        onClick={(e) => e.preventDefault()}
      >
        <span className="inline-flex size-full items-center justify-center gap-[inherit] animate-out fade-out-0 zoom-out-[0.96] blur-out-[2px] fill-mode-forwards duration-(--dur-fade) ease-(--ease-out)">
          {props.children}
        </span>
        <span className="absolute inset-0 grid place-items-center animate-in fade-in-0 zoom-in-90 blur-in-[2px] duration-(--dur-fade) ease-(--ease-out)">
          <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
        </span>
      </ButtonPrimitive>
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
