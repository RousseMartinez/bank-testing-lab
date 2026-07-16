const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body =
    res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, body };
}

describe("Smoke test (verificacion critica post-despliegue)", () => {
  test("el servicio esta arriba", async () => {
    const { status } = await api("/health");
    expect(status).toBe(200);
  });

  test("se puede crear una cuenta", async () => {
    const { status, body } = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeUser" }),
    });
    expect(status).toBe(201);
    expect(body.id).toBeDefined();
  });

  test("se puede depositar en una cuenta recien creada", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDeposito" }),
    });
    const { status, body } = await api(
      `/accounts/${cuenta.body.id}/deposit`,
      { method: "POST", body: JSON.stringify({ amountCents: 1000 }) }
    );
    expect(status).toBe(200);
    expect(Number(body.balance)).toBe(1000);
  });

  test("se puede consultar el listado de cuentas", async () => {
    const { status, body } = await api("/accounts");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test("se puede ejecutar una transferencia basica entre dos cuentas", async () => {
    const origen = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeOrigen" }),
    });
    await api(`/accounts/${origen.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const destino = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDestino" }),
    });

    const { status } = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: origen.body.id,
        toId: destino.body.id,
        amountCents: 5000,
      }),
    });
    expect(status).toBe(201);
  });

  test("se puede retirar la totalidad del saldo depositado", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeRetiro" }),
    });
    await api(`/accounts/${cuenta.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });

    const { status } = await api(`/accounts/${cuenta.body.id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });
    expect(status).toBe(200);
  });

  test("GET /accounts/:id responde en menos de 300 ms", async () => {
  // 1. Creamos una cuenta de prueba rápida para tener un ID real
  const cuenta = await api("/accounts", { 
    method: "POST", 
    body: JSON.stringify({ owner: "SmokePerformance" }) 
  });
  const id = cuenta.body.id;

  // 2. Medimos el tiempo que tarda la consulta
  const inicio = Date.now();
  const res = await api(`/accounts/${id}`);
  const duracion = Date.now() - inicio;
  
  expect(res.status).toBe(200);
  expect(duracion).toBeLessThan(300); // Latencia tolerable en milisegundos
});

test("las cinco rutas principales responden sin error 500 en recorrido secuencial", async () => {
  // Ruta 1: Comprobar salud del servidor
  const r1 = await api("/health");
  expect(r1.status).not.toBe(500);

  // Ruta 2: Listar cuentas
  const r2 = await api("/accounts");
  expect(r2.status).not.toBe(500);

  // Ruta 3: Crear una cuenta
  const r3 = await api("/accounts", { 
    method: "POST", 
    body: JSON.stringify({ owner: "SmokeRutas" }) 
  });
  expect(r3.status).not.toBe(500);
  const id = r3.body.id;

  // Ruta 4: Realizar un depósito
  const r4 = await api(`/accounts/${id}/deposit`, { 
    method: "POST", 
    body: JSON.stringify({ amountCents: 100 }) 
  });
  expect(r4.status).not.toBe(500);

  // Ruta 5: Consultar la cuenta creada
  const r5 = await api(`/accounts/${id}`);
  expect(r5.status).not.toBe(500);
});
});
