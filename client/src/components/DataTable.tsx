import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PriceData {
  date: Date;
  price: number;
  dailyChange: number;
}

interface DataTableProps {
  data: PriceData[];
  fundSymbol: string;
  isLoading?: boolean;
}

export default function DataTable({ data, fundSymbol, isLoading = false }: DataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-label={`Loading ${fundSymbol} Fund price history`}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400" role="status">
        No official price history is available for {fundSymbol} Fund in this period.
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <Table aria-label={`${fundSymbol} Fund official price history`}>
        <caption className="sr-only">Official daily share prices and percentage changes for the {fundSymbol} Fund</caption>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead scope="col" className="font-semibold">Date</TableHead>
            <TableHead scope="col" className="text-right font-semibold">Share Price</TableHead>
            <TableHead scope="col" className="text-right font-semibold">Daily Change</TableHead>
            <TableHead scope="col" className="text-right font-semibold">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, idx) => {
            const isPositive = row.dailyChange >= 0;
            const dateStr = new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            return (
              <TableRow key={`${dateStr}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                <TableCell className="whitespace-nowrap font-medium">{dateStr}</TableCell>
                <TableCell className="whitespace-nowrap text-right">${row.price.toFixed(4)}</TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                    {isPositive ? '+' : ''}{row.dailyChange.toFixed(3)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {isPositive ? <TrendingUp className="inline h-4 w-4 text-emerald-600" aria-label="Positive" /> : <TrendingDown className="inline h-4 w-4 text-rose-600" aria-label="Negative" />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
