// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCl8G8XsPdNcucrtavd4yyqN7VgCm5GTuc",
    authDomain: "pizzabot-92db2.firebaseapp.com",
    databaseURL: "https://pizzabot-92db2-default-rtdb.firebaseio.com",
    projectId: "pizzabot-92db2",
    storageBucket: "pizzabot-92db2.appspot.com",
    messagingSenderId: "1067749954807",
    appId: "1:1067749954807:web:c56b0658d53b7b5a766ff2"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database(app);

function gerarComandaTermica(pedido) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 230; // 58mm em 203dpi
    let height = 500;
    
    // Configurações de fonte
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Quebra de texto
    function wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineArray = [];

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lineArray.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lineArray.push(line);

        for (let m = 0; m < lineArray.length; m++) {
            ctx.fillText(lineArray[m], x, y);
            y += lineHeight;
        }
        return y;
    }

    // Cabeçalho
    let y = 10;
    ctx.fillText('=== Disk Pizza ===', 10, y);
    y += 20;
    ctx.fillText(`Data: ${new Date(pedido.date).toLocaleString()}`, 10, y);
    y += 20;

    // Detalhes do pedido
    y = wrapText(`Cliente: ${pedido.cliente}`, 10, y, width - 20, 15);
    y += 15;
    ctx.fillText('Itens:', 10, y);
    y += 15;
    
    pedido.items.forEach(item => {
        const text = `- ${item.name} (${item.quantity}x) R$${item.price.toFixed(2)}`;
        y = wrapText(text, 20, y, width - 30, 15);
    });
    
    y += 15;
    ctx.fillText(`Total: R$${pedido.total.toFixed(2)}`, 10, y);
    y += 20;
    ctx.fillText(`Endereço: ${pedido.orderDetails.address}`, 10, y);
    y += 20;
    ctx.fillText(`Pagamento: ${pedido.paymentMethod}`, 10, y);
    if(pedido.troco > 0) {
        y += 15;
        ctx.fillText(`Troco para: R$${pedido.troco.toFixed(2)}`, 10, y);
    }
    
    // Ajusta altura do canvas
    canvas.width = width;
    canvas.height = y + 30;

    return canvas.toDataURL();
}

// Ouvir novos pedidos
database.ref('vendas').on('child_added', (snapshot) => {
    const pedido = snapshot.val();
    const comandaImg = gerarComandaTermica(pedido);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${comandaImg}" class="comanda-img">
        <div class="card-actions">
            <button class="btn print-btn" onclick="printTermica(this)">Imprimir</button>
        </div>
    `;
    
    document.getElementById('cardsContainer').prepend(card);
});

function printTermica(btn) {
    const imgSrc = btn.closest('.card').querySelector('img').src;
    const win = window.open('', '_blank');
    win.document.write(`<img src="${imgSrc}" style="width:58mm">`);
    win.document.close();
    win.print();
}