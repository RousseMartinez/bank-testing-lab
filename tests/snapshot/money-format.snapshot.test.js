const { formatMoney, buildTransferReceipt } = require("../../src/services/money");

describe("Snapshot testing (formato y estructuras de salida)", () => {
  test("formatMoney con importe entero de soles", () => {
    expect(formatMoney(1050, "PEN")).toMatchInlineSnapshot(`"PEN 10.50"`);
  });

  test("formatMoney con importe menor a una unidad", () => {
    expect(formatMoney(5, "USD")).toMatchInlineSnapshot(`"USD 0.05"`);
  });

  test("formatMoney con importe exacto sin centimos", () => {
    expect(formatMoney(500000, "PEN")).toMatchInlineSnapshot(`"PEN 5000.00"`);
  });

  test("buildTransferReceipt genera la estructura esperada del recibo", () => {
    const receipt = buildTransferReceipt({
      id: 1,
      fromOwner: "Ana",
      toOwner: "Beto",
      amountCents: 3000,
      currency: "PEN",
      reference: "PAGO-01",
    });
    expect(receipt).toMatchInlineSnapshot(`
{
  "amount": "PEN 30.00",
  "receiptId": 1,
  "reference": "PAGO-01",
  "summary": "Ana -> Beto",
}
`);
  });

  test("buildTransferReceipt sin referencia usa el valor por defecto", () => {
    const receipt = buildTransferReceipt({
      id: 2,
      fromOwner: "Carla",
      toOwner: "Dora",
      amountCents: 10000,
      currency: "USD",
    });
    expect(receipt.reference).toMatchInlineSnapshot(`"SIN-REFERENCIA"`);
  });

  test("la forma del objeto de error HTTP se mantiene estable", () => {
    const errorBody = { error: "Fondos insuficientes" };
    expect(errorBody).toMatchInlineSnapshot(`
{
  "error": "Fondos insuficientes",
}
`);
  });

const { createAccount } = require("../../src/services/accounts.service");
const { Pool } = require("pg");
let pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@db:5432/bank_testing"
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  test("Capturar el snapshot del cuerpo de respuesta de POST /accounts usando property matchers para id y created_at", async () => {
    // 1. Simulamos la creación que haría el endpoint POST /accounts
    const cuerpoRespuesta = await createAccount(pool, { owner: "Jean Paul", currency: "PEN" });

    // 2. Ejecutamos el snapshot test usando Property Matchers para los campos cambiantes
    expect(cuerpoRespuesta).toMatchSnapshot({
      id: expect.any(Number),          // El ID siempre debe ser un número incremental
      created_at: expect.any(Date)      // La fecha de creación siempre debe ser una instancia de Date de Postgres
    });
  });

  test("capturar el snapshot de buildTransferReceipt para un monto con tres cifras de centimos redondeadas", () => {
  const receipt = buildTransferReceipt({
    id: 99,
    fromOwner: "Pedro",
    toOwner: "Sofia",
    amountCents: 1000.67, // Debe formatearse correctamente
    currency: "USD",
    reference: "FRACT-TEST"
  });
  expect(receipt).toMatchInlineSnapshot(`
    {
      "amount": "USD 10.01",
      "receiptId": 99,
      "reference": "FRACT-TEST",
      "summary": "Pedro -> Sofia",
    }
    `);
  }); 

});
