
export interface Transaction {
  id: number;
  date: string;
  time: string;
  type: 'buy' | 'sell';
  mat: string;
  qty: number;
  price: number;
  client: string;
  method: 'cash' | 'card' | 'debt';
  total: number;
  is_paid: boolean;
  date_repaid?: string;
}

export interface Processing {
  id: number;
  date: string;
  time: string;
  from: string;
  qtyIn: number;
  to: string;
  qtyOut: number;
}

export interface Expense {
  id: number;
  date: string;
  time: string;
  cat: string;
  amt: number;
  desc: string;
}

export interface Database {
  transactions: Transaction[];
  expenses: Expense[];
  processing: Processing[];
  rawMaterials: string[];
  finishedGoods: string[];
  expenseCategories: string[];
  workers: string[];
}

export interface StockMap {
  [key: string]: number;
}

export enum TabType {
  BUY = 'buy',
  PROCESS = 'process',
  SELL = 'sell',
  FINANCE = 'finance'
}