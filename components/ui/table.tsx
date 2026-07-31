import React from 'react';

export const Table = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
);
Table.displayName = 'Table';

export const TableHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`border-b border-border/40 bg-secondary/20 [&_tr]:border-b ${className}`} {...props} />
);
TableHeader.displayName = 'TableHeader';

export const TableBody = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
);
TableBody.displayName = 'TableBody';

export const TableFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot className={`border-t border-border/40 bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`} {...props} />
);
TableFooter.displayName = 'TableFooter';

export const TableRow = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`border-b border-border/20 transition-colors hover:bg-secondary/20 data-[state=selected]:bg-muted ${className}`}
    {...props}
  />
);
TableRow.displayName = 'TableRow';

export const TableHead = ({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
);
TableHead.displayName = 'TableHead';

export const TableCell = ({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);
TableCell.displayName = 'TableCell';
