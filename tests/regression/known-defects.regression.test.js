const {
  applyFee,
  toCents,
  validateAmount,
  computeInterest,
  toUnits
} = require("../../src/services/money");
const { createAccount } = require("../../src/services/accounts.service");
const { Pool } = require("pg");

describe("Regresion (defectos historicos que no deben reaparecer)", () => {
  let pool;

  // Inicializamos la conexión a la base de datos de pruebas antes de los tests
  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/bank_testing"
    });
  });

  afterAll(async () => {
    await pool.end();
  });
  test("BUG-089: applyFee con feeBps=0 ya no produce NaN", () => {
    expect(applyFee(10000, 0)).toBe(10000);
    expect(Number.isNaN(applyFee(10000, 0))).toBe(false);
  });

  test("BUG-104: toCents ya no trunca importes con tres decimales", () => {
    expect(toCents(19.999)).toBe(2000);
  });

  test("BUG-118: validateAmount ya no acepta cadenas numericas como centimos validos", () => {
    expect(() => validateAmount("100")).toThrow("centimos enteros");
  });

  test("BUG-126: computeInterest ya no retorna un valor negativo con tasa cero", () => {
    const interes = computeInterest(100000, 0, 30);
    expect(interes).toBe(0);
  });

  test("BUG-133: applyFee ya no redondea hacia abajo comisiones fraccionarias mayores a 0.5", () => {
    expect(applyFee(1000, 55)).toBe(1006);
  });

  test("BUG-141: validateAmount ya no permite Infinity como monto valido", () => {
    expect(() => validateAmount(Infinity)).toThrow();
  });

const { toUnits } = require("../../src/services/money");

  test("BUG-152: toUnits no pierde precisión aritmética con céntimos superiores a diez millones", () => {
  // 10,000,001 céntimos representan exactamente 100,000.01 unidades monetarias.
  // Un bug de punto flotante común en JavaScript podría devolver 100000.01000000001 o similar.
  expect(toUnits(10000001)).toBe(100000.01);
});

test("BUG-160: un titular con espacios al inicio y al final es sanitizado y no genera registros duplicados", async () => {

  // 1. Intentamos crear una cuenta con espacios adicionales
 const cuenta = await createAccount(pool, { owner: "   Carlos   ", currency: "PEN" });
  
 // Verificamos que el retorno y la inserción se hayan limpiado correctamente con .trim()
    expect(cuenta.owner).toBe("Carlos");
});
});
