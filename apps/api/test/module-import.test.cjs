const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
test("all API modules and Mongoose schemas can load at runtime", () => {
  assert.doesNotThrow(() => require("../dist/app.module.js"));
});

test("reference schema paths cast string IDs as ObjectIds, not Mixed", () => {
  const { readdirSync } = require("node:fs");
  const { join } = require("node:path");
  const root = join(__dirname, "../dist");
  for (const file of readdirSync(root, { recursive: true })) {
    if (!file.endsWith(".schema.js")) continue;
    for (const schema of Object.values(require(join(root, file)))) {
      if (!schema?.paths) continue;
      for (const [name, path] of Object.entries(schema.paths)) {
        if (["providerOrderId", "providerPaymentId"].includes(name)) {
          assert.equal(path.instance, "String", `${file}: ${name}`);
          continue;
        }
        if (name.endsWith("Id")) assert.equal(path.instance, "ObjectId", `${file}: ${name}`);
        if (name.endsWith("Ids")) assert.equal(path.caster?.instance, "ObjectId", `${file}: ${name}`);
      }
    }
  }
});
