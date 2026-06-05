async function testLogin(email: string, password: string, expectedRole: string) {
  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, expectedRole }),
  });
  const data = await res.json();
  console.log(email, expectedRole, res.status, data);
}

async function main() {
  await testLogin("operatore@zootropolis.it", "Operatore123!", "operator");
  await testLogin("admin@zootropolis.it", "Admin123!", "admin");
  await testLogin("operatore@zootropolis.it", "Operatore123!", "user");
}

main().catch(console.error);
