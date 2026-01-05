const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  // Optional: check admin role
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated");
  }

  const { email, password, name, industryNumber, companyId } = data;

  const user = await admin.auth().createUser({
    email,
    password,
    displayName: name,
  });

  await admin.firestore().collection("users").doc(user.uid).set({
    name,
    industryNumber,
    companyId,
    role: "employee",
    online: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: user.uid };
});
