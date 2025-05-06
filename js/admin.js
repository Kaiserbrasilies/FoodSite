// admin.js - Firebase v11.6.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  onValue, 
  update,
  get
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Configuração do Firebase (idêntica ao firebaseVendas.js)
const firebaseConfig = {
  apiKey: "AIzaSyCl8G8XsPdNcucrtavd4yyqN7VgCm5GTuc",
  authDomain: "pizzabot-92db2.firebaseapp.com",
  databaseURL: "https://pizzabot-92db2-default-rtdb.firebaseio.com",
  projectId: "pizzabot-92db2",
  storageBucket: "pizzabot-92db2.firebasestorage.app",
  messagingSenderId: "1067749954807",
  appId: "1:1067749954807:web:c56b0658d53b7b5a766ff2"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ==================== AUTENTICAÇÃO ====================
async function checkPassword() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    loadStatistics();
  } catch (error) {
    alert('Erro de login: ' + error.message.replace('Firebase: ', ''));
  }
}

// ==================== LOGOUT ====================
function logout() {
  signOut(auth).then(() => {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
  });
}

// ==================== ESTATÍSTICAS ====================
function loadStatistics() {
  const vendasRef = ref(database, 'vendas');
  
  onValue(vendasRef, (snapshot) => {
    const vendas = snapshot.val();
    const hoje = new Date().toISOString().split('T')[0];
    
    let totalPedidos = 0;
    let faturamento = 0;
    let totalPix = 0;
    let totalCash = 0;
    const itensVendidos = {};

    for (const vendaId in vendas) {
      const venda = vendas[vendaId];
      if (venda.date.startsWith(hoje)) {
        totalPedidos++;
        faturamento += venda.total;
        
        // Soma os valores por método de pagamento
        if (venda.paymentMethod === 'pix') {
          totalPix += venda.total;
        } else if (venda.paymentMethod === 'cash') {
          totalCash += venda.total;
        }

        // Contabiliza itens
        venda.items.forEach(item => {
          itensVendidos[item.name] = (itensVendidos[item.name] || 0) + item.quantity;
        });
      }
    }

    const itemTop = Object.entries(itensVendidos).sort((a, b) => b[1] - a[1])[0];
    
    // Formatação dos valores
    const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

    // Atualiza a interface
    document.getElementById('totalOrders').textContent = totalPedidos;
    document.getElementById('totalRevenue').textContent = formatarMoeda(faturamento);
    document.getElementById('totalPix').textContent = formatarMoeda(totalPix);
    document.getElementById('totalCash').textContent = formatarMoeda(totalCash);
    document.getElementById('topProduct').textContent = itemTop 
      ? `${itemTop[0]} (${itemTop[1]}x)`
      : '-';
  });
}

// ==================== LIMPEZA DE DADOS ====================
async function resetSalesData() {
  if (!confirm('Isso apagará TODAS as vendas de hoje. Continuar?')) return;

  try {
    const vendasRef = ref(database, 'vendas');
    const snapshot = await get(vendasRef);
    const vendas = snapshot.val();
    const updates = {};
    const hoje = new Date().toISOString().split('T')[0];

    for (const vendaId in vendas) {
      if (vendas[vendaId].date.startsWith(hoje)) {
        updates[`vendas/${vendaId}`] = null;
      }
    }

    await update(ref(database), updates);
    alert('Dados de hoje resetados com sucesso!');
    loadStatistics();
  } catch (error) {
    alert('Erro ao resetar: ' + error.message);
  }
}

// Exportar funções para o escopo global
window.checkPassword = checkPassword;
window.resetSalesData = resetSalesData;
window.logout = logout;
window.toggleMenu = toggleMenu;

function toggleMenu() {
  const menu = document.getElementById("menuItems");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("show");
  icon.classList.toggle("active");
}
