const { validateAmount, canWithdraw } = require("./money");

async function createAccount(pool, { owner, currency } = {}) {
  if (!owner || typeof owner !== "string" || !owner.trim()) {
    const err = new Error("El titular es obligatorio");
    err.status = 400;
    throw err;
  }
  const { rows } = await pool.query(
    "INSERT INTO accounts (owner, currency) VALUES ($1, $2) " +
      "RETURNING id, owner, balance, currency, status, created_at",
    [owner.trim(), currency || "PEN"]
  );
  return rows[0];
}

async function getAccount(pool, id) {
  const { rows } = await pool.query(
    "SELECT id, owner, balance, currency, status, created_at " +
      "FROM accounts WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

async function listAccounts(pool) {
  const { rows } = await pool.query(
    "SELECT id, owner, balance, currency, status, created_at " +
      "FROM accounts ORDER BY id DESC"
  );
  return rows;
}

async function deposit(pool, id, amountCents) {
  validateAmount(amountCents);
  const { rows } = await pool.query(
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2 " +
      "RETURNING id, owner, balance, currency, status",
    [amountCents, id]
  );
  if (rows.length === 0) {
    const err = new Error("Cuenta no encontrada");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function withdraw(pool, id, amountCents) {
  validateAmount(amountCents);
  const account = await getAccount(pool, id);
  if (!account) {
    const err = new Error("Cuenta no encontrada");
    err.status = 404;
    throw err;
  }
  if (!canWithdraw(Number(account.balance), amountCents)) {
    const err = new Error("Fondos insuficientes");
    err.status = 422;
    throw err;
  }
  const nuevoSaldo = Number(account.balance) - amountCents;
  await pool.query("UPDATE accounts SET balance = $1 WHERE id = $2", [
    nuevoSaldo,
    id,
  ]);
  return { ...account, balance: nuevoSaldo };
}

async function transfer(pool, { fromId, toId, amountCents, reference } = {}) {
  validateAmount(amountCents);

  // D-03: Validar que no sea una autotransferencia antes de operar
  if (fromId === toId) {
    const err = new Error("No se puede transferir a la misma cuenta");
    err.status = 400; // Código HTTP requerido por el contrato y la especificación
    throw err;
  }

  const from = await getAccount(pool, fromId);
  const to = await getAccount(pool, toId);

  if (!from || !to) {
    const err = new Error("Cuenta de origen o destino no encontrada");
    err.status = 404;
    throw err;
  }

  if (!canWithdraw(Number(from.balance), amountCents)) {
    const err = new Error("Fondos insuficientes");
    err.status = 422;
    throw err;
  }

  // D-05: Adquirir cliente y arrancar transacción atómica
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Debitar saldo de la cuenta de origen
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amountCents, fromId]
    );

    // 2. Acreditar saldo a la cuenta de destino
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amountCents, toId]
    );

    // 3. Registrar la transferencia en el historial
    const { rows } = await client.query(
      "INSERT INTO transfers (from_account, to_account, amount, reference) " +
        "VALUES ($1, $2, $3, $4) RETURNING id, from_account, to_account, amount, reference, created_at",
      [fromId, toId, amountCents, reference || null]
    );

    await client.query("COMMIT"); // Consolidar transacción
    return rows[0];

  } catch (error) {
    await client.query("ROLLBACK"); // Deshacer cambios parciales si algo falla
    throw error;
  } finally {
    client.release(); // Liberar el cliente de vuelta al pool
  }
}

module.exports = {
  createAccount,
  getAccount,
  listAccounts,
  deposit,
  withdraw,
  transfer,
};
