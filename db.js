import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("./data/db.json");
const db = new Low(adapter, { chamados: [] });

export { db };