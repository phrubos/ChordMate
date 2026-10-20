"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
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
    return (
      <ButtonPrimitive
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative overflow-hidden !pointer-events-auto opacity-90"
        )}
        aria-disabled={true}
        onClick={(e) => {
          e.preventDefault()
        }}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-1.5 transition-[color,background-color,border-color,opacity,transform] duration-300 w-full h-full opacity-0 scale-95">
          {props.children}
        </span>
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <div className="size-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
          <div className="size-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
          <div className="size-2 rounded-full bg-current animate-bounce" />
        </div>
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
