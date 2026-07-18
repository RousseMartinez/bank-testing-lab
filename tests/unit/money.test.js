const {
  toCents,
  formatMoney,
  validateAmount,
  canWithdraw,
  applyFee,
  computeInterest,
} = require("../../src/services/money");

describe("money (pruebas unitarias)", () => {
  test("toCents convierte unidades a centimos enteros", () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0.01)).toBe(1);
  });

  test("toCents rechaza valores no numericos", () => {
    expect(() => toCents("100")).toThrow("El monto debe ser un numero");
    expect(() => toCents(NaN)).toThrow("El monto debe ser un numero");
  });

  test("formatMoney presenta el importe con dos decimales y moneda", () => {
    expect(formatMoney(1050, "PEN")).toBe("PEN 10.50");
    expect(formatMoney(5, "USD")).toBe("USD 0.05");
  });

  test("validateAmount acepta enteros positivos y rechaza el resto", () => {
    expect(validateAmount(100)).toBe(true);
    expect(() => validateAmount(0)).toThrow("mayor que cero");
    expect(() => validateAmount(-5)).toThrow("mayor que cero");
    expect(() => validateAmount(10.5)).toThrow("centimos enteros");
  });

  test("canWithdraw permite retirar exactamente el saldo disponible", () => {
    expect(canWithdraw(1000, 1000)).toBe(true);
    expect(canWithdraw(1000, 999)).toBe(true);
    expect(canWithdraw(1000, 1001)).toBe(false);
  });

  test("applyFee suma la comision en puntos basicos al monto", () => {
    expect(applyFee(10000, 50)).toBe(10050);
    expect(applyFee(10000, 0)).toBe(10000);
  });

  test("computeInterest calcula el interés simple correctamente para 30 días al 12% anual sobre 100000 céntimos", () => {
  // 100000 * 0.12 * (30 / 365) = 986.30 -> Redondeado a 986 céntimos
  expect(computeInterest(100000, 12, 30)).toBe(986);
});

  test("toCents redondea correctamente 19.999 a 2000 céntimos y no a 1999", () => {
  expect(toCents(19.999)).toBe(2000);
});

  test("M4 BUSTER: Eliminar mutante superviviente en la fórmula de computeInterest", () => {
  // Con un monto alto (10,000,000 céntimos), tasa del 5% y 180 días:
  // Fórmula exacta: 10000000 * 0.05 * (180 / 365) = 246575.342... -> Redondeado a 246575
  // Si Stryker altera la fórmula (ej. cambiando el orden o truncando divisiones), el resultado diferirá drásticamente.
  expect(computeInterest(10000000, 5, 180)).toBe(246575);
});
});
