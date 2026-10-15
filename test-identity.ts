// Uji lapisan identitas (src/lib/identity.ts).
// Jalankan dari root repo: npx tsx test-identity.ts
import {
  AUTH_LOGIN_PATH,
  AUTH_REGISTER_PATH,
  isAuthResponseValid,
  isIdentityProvider,
  loginRequestBody,
  memberIdFor,
  memberIdFromProfileUser,
  profileFetchPath,
  profileNameField,
  profileUpdateBody,
  profileUpdatePath,
  profileUserMatches,
  registerRequestBody,
  registerRequiredFields,
  toProfilePayload,
  type IdentityProvider,
} from "./src/lib/identity";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

console.log("[1] Deteksi penyedia");
check("geasteats dikenali", isIdentityProvider("geasteats"));
check("pointlab dikenali", isIdentityProvider("pointlab"));
check("nilai lain ditolak", !isIdentityProvider("lainnya") && !isIdentityProvider(undefined));
check("path auth sama untuk kedua penyedia", AUTH_LOGIN_PATH === "/api/auth/login" && AUTH_REGISTER_PATH === "/api/auth/register");

console.log("[2] Body login");
check(
  "geasteats + nomor HP -> phone_number",
  JSON.stringify(loginRequestBody("geasteats", "081234567890", "rahasia")) === JSON.stringify({ phone_number: "081234567890", password: "rahasia" }),
);
check(
  "geasteats + email -> email",
  JSON.stringify(loginRequestBody("geasteats", " ayo@ngolab.id ", "rahasia")) === JSON.stringify({ email: "ayo@ngolab.id", password: "rahasia" }),
);
check(
  "pointlab -> identifier",
  JSON.stringify(loginRequestBody("pointlab", "6706210001", "rahasia")) === JSON.stringify({ identifier: "6706210001", password: "rahasia" }),
);

console.log("[3] Body register");
const input = { name: "Budi", phone: "081200000000", email: "budi@ngolab.id", password: "rahasia123", nim: "6706210099" };
check(
  "geasteats pakai field name/phone_number",
  JSON.stringify(registerRequestBody("geasteats", input)) === JSON.stringify({ name: "Budi", phone_number: "081200000000", email: "budi@ngolab.id", password: "rahasia123" }),
);
check(
  "pointlab mengirim nim + password + nama/email/phone",
  JSON.stringify(registerRequestBody("pointlab", input)) === JSON.stringify({ nim: "6706210099", password: "rahasia123", nama: "Budi", email: "budi@ngolab.id", phone: "081200000000" }),
);
check(
  "form pointlab minta NIM",
  JSON.stringify(registerRequiredFields("pointlab")) === JSON.stringify(["nim", "password"]),
);
check(
  "form geasteats minta nama/telepon/email",
  JSON.stringify(registerRequiredFields("geasteats")) === JSON.stringify(["name", "phone", "email", "password"]),
);

console.log("[4] memberId");
check(
  "pointlab: memberId = user.id (angka)",
  memberIdFor("pointlab", { id: 1, nama: "Ayesha" }) === "1",
);
check(
  "pointlab: memberId = user.id (string u-...)",
  memberIdFor("pointlab", { id: "u-1791989531265" }) === "u-1791989531265",
);
check(
  "geasteats: pakai memberId kalau ada",
  memberIdFor("geasteats", { id: "u-9", memberId: "mem-77" }) === "mem-77",
);
check(
  "geasteats tanpa memberId -> null",
  memberIdFor("geasteats", { id: "u-9" }) === null,
);
check("user kosong -> null", memberIdFor("pointlab", null) === null);

console.log("[5] Payload profil untuk normalizeUserProfile");
const profilePointlab = toProfilePayload("pointlab", { id: 1, nama: "Ayesha", poin: 1250 });
check("pointlab: memberId disuntik dari id", profilePointlab.memberId === "1" && profilePointlab.nama === "Ayesha");
const profileGeasteats = toProfilePayload("geasteats", { id: "u-9", memberId: "mem-77" });
check("geasteats: payload dibiarkan apa adanya", profileGeasteats.memberId === "mem-77");
check("objek asli tidak dimutasi", (() => {
  const original: Record<string, unknown> = { id: 5, nama: "Asli" };
  toProfilePayload("pointlab", original);
  return original.memberId === undefined;
})());

console.log("[6] Validasi respons auth");
check(
  "login pointlab sah",
  isAuthResponseValid({ token: "jwt-abc", user: { id: 1, nama: "Ayesha" } }),
);
check(
  "register user baru (id string) sah",
  isAuthResponseValid({ token: "jwt-abc", user: { id: "u-1791989531265", nama: "Uji" } }),
);
check("tanpa token ditolak", !isAuthResponseValid({ user: { id: 1 } }));
check("tanpa user.id ditolak", !isAuthResponseValid({ token: "jwt-abc", user: { nama: "X" } }));
check("payload bukan objek ditolak", !isAuthResponseValid(null) && !isAuthResponseValid("token"));

console.log("[7] Path & body profil per penyedia");
check("pointlab muat profil: /api/users/profile", profileFetchPath("pointlab", "u-1") === "/api/users/profile");
check("pointlab simpan profil: /api/users/profile", profileUpdatePath("pointlab", "u-1") === "/api/users/profile");
check("geasteats muat profil per id", profileFetchPath("geasteats", "u-9") === "/api/users/u-9/recommendations");
check("geasteats simpan profil per id", profileUpdatePath("geasteats", "u-9") === "/api/users/u-9");
const bodyPl = profileUpdateBody("pointlab", { userId: "u-1", name: " Ayesha ", phone: "081234", avatar: "/avatar.svg" });
check("pointlab body: nama/phone/avatar_url", bodyPl.nama === "Ayesha" && bodyPl.phone === "081234" && bodyPl.avatar_url === "/avatar.svg");
const bodyGas = profileUpdateBody("geasteats", { userId: "u-9", name: "Budi", phone: "08123" });
check("geasteats body: telp (bukan phone)", bodyGas.telp === "08123" && bodyGas.phone === undefined);
const bodyNoAvatar = profileUpdateBody("pointlab", { userId: "u-1", name: "X", avatar: "data:image/png;base64,AAAA" });
check("avatar data URL tidak dikirim ke server", bodyNoAvatar.avatar_url === undefined);
check("nama field profil pointlab", profileNameField("pointlab") === "nama" && profileNameField("geasteats") === "name");

console.log("[8] Validasi & memberId dari respons profil");
check("pointlab: user.id cocok sesi", profileUserMatches("pointlab", { user: { id: "u-5" } }, "u-5"));
check("pointlab: id beda ditolak", !profileUserMatches("pointlab", { user: { id: "u-6" } }, "u-5"));
check("tanpa user ditolak", !profileUserMatches("pointlab", { message: "ok" }, "u-5"));
check("pointlab memberId dari user.id", memberIdFromProfileUser("pointlab", { user: { id: "u-5" } }) === "u-5");
check("geasteats memberId dari field memberId", memberIdFromProfileUser("geasteats", { user: { id: "u-9", memberId: "mem-7" } }) === "mem-7");
check("geasteats tanpa memberId -> null", memberIdFromProfileUser("geasteats", { user: { id: "u-9" } }) === null);

const providers: IdentityProvider[] = ["geasteats", "pointlab"];
for (const provider of providers) {
  check(`body login ${provider} tidak kosong`, Object.keys(loginRequestBody(provider, "x", "y")).length > 0);
}

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
process.exit(failed === 0 ? 0 : 1);
