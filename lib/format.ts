export const brl = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const pct = (v: number) =>
  `${(v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export const calcPrecoVenda = (custo: number, margem: number) =>
  Number((custo * (1 + margem / 100)).toFixed(2));

export const calcMargem = (custo: number, preco: number) =>
  custo > 0 ? Number((((preco - custo) / custo) * 100).toFixed(2)) : 0;
