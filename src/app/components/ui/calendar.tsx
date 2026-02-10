"use client";

import * as React from "react";
import "react-day-picker/dist/style.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 w-full max-w-full", className)}
      classNames={{
        months: "flex flex-col gap-1 w-full",
        month: "flex flex-col gap-1 w-full",
        caption: "flex justify-center pt-1 relative items-center w-full mb-3",
        caption_label: "text-base font-semibold text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-white hover:bg-gray-50 border-gray-200 p-0 opacity-70 hover:opacity-100 transition-all",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full mb-1",
        head_cell:
          "flex-1 text-gray-500 rounded-md text-center font-medium text-xs h-8 flex items-center justify-center",
        row: "flex w-full gap-1",
        cell: cn(
          "relative p-0 text-center text-sm flex-1 h-9 flex items-center justify-center focus-within:relative focus-within:z-20 rounded-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 text-sm font-normal transition-all hover:bg-green-50 hover:text-green-600 rounded-md",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-green-500 aria-selected:text-white rounded-l-md",
        day_range_end:
          "day-range-end aria-selected:bg-green-500 aria-selected:text-white rounded-r-md",
        day_selected:
          "bg-green-500 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white font-medium shadow-sm",
        day_today: "bg-gray-100 text-gray-900 font-semibold border border-green-200",
        day_outside:
          "day-outside text-gray-300 aria-selected:text-gray-300 hover:bg-gray-50",
        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-green-100 aria-selected:text-green-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
