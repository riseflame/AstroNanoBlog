import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

export function dateRange(startDate: Date, endDate?: Date | string): string {
  const formatYearMonth = (date: Date) => Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(date);

  const start = formatYearMonth(startDate);
  let end;

  if (endDate) {
    if (typeof endDate === "string") {
      end = endDate;
    } else {
      end = formatYearMonth(endDate);
    }
  }

  return end ? `${start} - ${end}` : start;
}