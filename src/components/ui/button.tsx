import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative w-full border-2 rounded-[8px] font-medium transition-all duration-150 ease-out font-game text-2xl text-center active:translate-y-1",
  {
    variants: {
      variant: {
        blue: "h-16 px-8 bg-blue-500 text-white hover:bg-blue-500/90 transition-colors border-black shadow-[0_6px_0px_0px_#000] active:shadow-[0_2px_0px_0px_#000]",
        green:
          "h-16 px-8 bg-green-500 text-white hover:bg-green-500/90 transition-colors border-black shadow-[0_6px_0px_0px_#000] active:shadow-[0_2px_0px_0px_#000]",
        default:
          "h-16 px-8 bg-white border-black shadow-[0_6px_0px_0px_#000] active:shadow-[0_2px_0px_0px_#000] hover:bg-gray-100 transition-colors ",
        outline:
          "h-16 px-8 bg-transparent border-gray-400 text-gray-700 hover:border-gray-600 hover:bg-gray-50 shadow-[0_4px_0px_0px_#ccc] active:shadow-[0_1px_0px_0px_#ccc]",
        icon: "h-8 w-8 rounded-full bg-white border-black shadow-[0_4px_0px_0px_#000] active:shadow-[0_1px_0px_0px_#000]",
        ghost: "h-auto px-2 py-1.5 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
