/* ============================================================
   CONFIGURAÇÃO DO FIREBASE — Painel Administrativo Meccal
   ============================================================
   Passo a passo:

   1. Acesse https://console.firebase.google.com e crie um projeto
      novo (pode chamar de "meccal-site" ou parecido).

   2. Dentro do projeto, vá em "Compilação" (Build) no menu lateral:
        - Authentication → Sign-in method → ative "E-mail/senha".
        - Firestore Database → Criar banco de dados → modo produção,
          região "southamerica-east1" (São Paulo) se disponível.
        - Storage → só ative se você quiser subir as fotos das
          máquinas para o Firebase Storage (plano pago "Blaze").
          Se preferir não configurar cobrança agora, pode pular
          esta etapa e deixar IMAGE_MODE como "inline" abaixo —
          as fotos ficam salvas comprimidas direto no Firestore,
          sem custo extra (funciona bem para fotos de até ~700KB
          depois de comprimidas, o que é suficiente pra maioria).

   3. Vá em "Configurações do projeto" (ícone de engrenagem) →
      geral → role até "Seus apps" → clique no ícone "</>" (Web) →
      registre um app (ex: "Site Meccal") → copie o objeto
      firebaseConfig que aparece e cole substituindo o objeto
      abaixo, em CONFIG.

   4. Troque CONFIGURED para "true" depois de colar as chaves.

   5. Crie o primeiro usuário administrador:
        a) Em Authentication → Users → "Adicionar usuário", crie
           com seu e-mail e uma senha.
        b) Copie o "User UID" gerado.
        c) Em Firestore → "Iniciar coleção" → nome da coleção:
           "users" → ID do documento: cole o UID copiado → adicione
           os campos:
             name   (string)  → seu nome
             email  (string)  → o mesmo e-mail usado no login
             role   (string)  → admin

   6. Regras do Firestore (Firestore → Regras) — cole algo como:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
            }
            match /maquinas/{docId} {
              allow read: if true;
              allow write: if request.auth != null;
            }
            match /leads/{docId} {
              allow create: if true;
              allow read, update, delete: if request.auth != null;
            }
          }
        }

   Pronto — depois disso, atualize a página do painel (admin/index.html)
   e a tela de configuração deve sumir, dando lugar à tela de login.
   ============================================================ */

const CONFIGURED = true; // troque para true depois de colar as chaves abaixo

const CONFIG = {
  apiKey: "AIzaSyCI9CvOrcy_zwIns0GacIPOehXNYcb_-uA",
  authDomain: "meccal-8f295.firebaseapp.com",
  projectId: "meccal-8f295",
  storageBucket: "meccal-8f295.firebasestorage.app",
  messagingSenderId: "160293689244",
  appId: "1:160293689244:web:313d0b0cb35152504f1a59",
};

// "inline"  → fotos comprimidas e salvas direto no Firestore (sem Storage, sem custo)
// "storage" → fotos sobem pro Firebase Storage (precisa do plano Blaze)
const IMAGE_MODE = "inline";

(function () {
  if (!CONFIGURED) {
    window.MC = { configured: false };
    return;
  }

  firebase.initializeApp(CONFIG);

  window.MC = {
    configured: true,
    config: CONFIG,
    auth: firebase.auth(),
    db: firebase.firestore(),
    storage: IMAGE_MODE === "storage" ? firebase.storage() : null,
    ROLES: ["admin", "editor"],
    IMAGE_MODE: IMAGE_MODE,
  };
})();
