"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export function CalendarDateRangePicker({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const handleSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);
        if (newDate?.from && newDate?.to) {
            toast.success("Fecha filtrada", {
                description: `${format(newDate.from, "PP", { locale: es })} - ${format(newDate.to, "PP", { locale: es })}`
            });
        }
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-between text-left font-medium bg-white/70 backdrop-blur-md border-slate-200/60 shadow-sm hover:bg-white hover:border-blue-300 transition-all duration-300 rounded-xl h-10",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-1.5 rounded-lg mr-2 text-blue-600">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            {date?.from ? (
                                date.to ? (
                                    <span className="text-slate-700 tracking-tight">
                                        {format(date.from, "LLL dd", { locale: es })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: es })}
                                    </span>
                                ) : (
                                    format(date.from, "LLL dd, y", { locale: es })
                                )
                            ) : (
                                <span>Seleccionar fechas</span>
                            )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200/80 shadow-xl" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={es}
                        className="p-3"
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
