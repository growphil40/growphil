'use client';

import React from 'react';

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableContainer({ children, className = '', ...props }: TableContainerProps) {
  return (
    <div 
      className={`w-full overflow-hidden border border-border bg-card text-foreground rounded-2xl shadow-sm ${className}`} 
      {...props}
    >
      <div className="w-full overflow-x-auto select-none scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <table className={`w-full text-left border-collapse text-xs ${className}`} {...props}>
      {children}
    </table>
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  active?: boolean;
}

export function TableRow({ children, active = false, className = '', ...props }: TableRowProps) {
  return (
    <tr 
      className={`border-b border-border/70 hover:bg-muted/5 transition-colors duration-150 ${
        active ? 'bg-[#079EB7]/5 dark:bg-[#079EB7]/10' : ''
      } ${className}`} 
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  isHeader?: boolean;
}

export function TableCell({ children, isHeader = false, className = '', ...props }: TableCellProps) {
  if (isHeader) {
    return (
      <th 
        className={`p-5 text-muted uppercase font-black tracking-widest text-[9.5px] border-b border-border/80 ${className}`} 
        {...props}
      >
        {children}
      </th>
    );
  }
  
  return (
    <td className={`p-5 text-foreground/90 font-medium ${className}`} {...props}>
      {children}
    </td>
  );
}
