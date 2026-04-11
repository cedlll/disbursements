"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      nativeButton
      render={<button type="button" />}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-0 bg-[#D4D9CE] p-0 transition-colors data-[checked]:bg-[#1C5C1C]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C5C1C] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 block size-6 translate-x-0 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, type SwitchProps }
