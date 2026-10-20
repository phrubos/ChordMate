"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-(--dur-press) ease-(--ease-out) outline-none select-none active:scale-[.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_*]:cursor-pointer [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 dark:shadow-[inset_0_1px_0_oklch(1_0_0/.3),0_6px_20px_color-mix(in_oklch,var(--primary)_20%,transparent)]",
        outline:
          "border-border-strong bg-transparent text-foreground hover:border-foreground/60 hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "bg-muted text-foreground hover:bg-muted/70 aria-expanded:bg-muted",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:ring-destructive",
        link: "text-primary-text underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-[13.5px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "relative size-7 after:absolute after:-inset-1.5 after:content-[''] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "relative size-9 after:absolute after:-inset-0.5 after:content-['']",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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
        <span className="inline-flex items-center justify-center gap-1.5 transition-all duration-300 w-full h-full opacity-0 scale-95">
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
