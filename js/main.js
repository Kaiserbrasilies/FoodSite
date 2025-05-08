document.addEventListener('DOMContentLoaded', () => {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCmzW58pEZQahqD1r6G03Tmge9UOmUpf0g",
        authDomain: "cardapiobot-347cc.firebaseapp.com",
        databaseURL: "https://cardapiobot-347cc-default-rtdb.firebaseio.com",
        projectId: "cardapiobot-347cc",
        storageBucket: "cardapiobot-347cc.firebasestorage.app",
        messagingSenderId: "545216340321",
        appId: "1:545216340321:web:973847a6ab3414c9c82520",
        measurementId: "G-1QSK3TZP7R"
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const categoriesRef = database.ref('categories');
    const categoriesMenu = document.getElementById('categoriesMenu');
    const itemsGrid = document.getElementById('itemsGrid');

    let cartCount = 0;
    const cartCounter = document.querySelector('.cart-counter');

    document.getElementById('cart-button').addEventListener('click', () => {
        document.getElementById('cartModal').style.display = 'flex';
    });

    let currentSelectedItem = null;
    let currentQuantity = 1; // ← Adicionado
    let currentCalculations = {
        basePrice: 0,
        selectedSizes: {},
        selectedOptions: {}
    };

    // Carregar categorias e primeira categoria
    categoriesRef.on('value', (snapshot) => {
        categoriesMenu.innerHTML = '';
        const data = snapshot.val();

        if (data) {
            const firstCategoryKey = Object.keys(data)[0];
            loadCategoryItems(firstCategoryKey);

            Object.entries(data).forEach(([key, category]) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <a href="#" data-category-id="${key}">${category.name}</a>
                `;
                listItem.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    loadCategoryItems(key);
                });
                categoriesMenu.appendChild(listItem);
            });
        }
    });

    function loadCategoryItems(categoryId) {
        const itemsRef = database.ref(`categories/${categoryId}/items`);
        itemsRef.on('value', (snapshot) => {
            itemsGrid.innerHTML = '';
            const items = snapshot.val();

            if (items) {
                Object.entries(items).forEach(([key, item]) => {
                    const itemCard = document.createElement('div');
                    itemCard.className = 'item-card';
                    itemCard.dataset.itemId = key;
                    itemCard.dataset.itemData = JSON.stringify(item);

                    itemCard.innerHTML = `
                        ${item.image ? `<img class="item-image" src="${item.image}" alt="${item.name}">` : ''}
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                            <div class="item-price">R$ ${item.basePrice.toFixed(2)}</div>
                            <div class="item-actions">
                                <button class="button add-to-cart">Adicionar</button>
                            </div>
                        </div>
                    `;

                    itemsGrid.appendChild(itemCard);
                });
            }
        });
    }

    itemsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const itemCard = e.target.closest('.item-card');
            const itemData = JSON.parse(itemCard.dataset.itemData);
            showItemOptionsModal(itemData);
        }
    });

    function showItemOptionsModal(item) {
        currentSelectedItem = item;
        currentQuantity = 1;
        currentCalculations = {
            basePrice: item.basePrice,
            selectedSizes: {},
            selectedOptions: {}
        };
    
        document.getElementById('itemOptionsTitle').textContent = item.name;
        const optionsBody = document.getElementById('itemOptionsBody');
        optionsBody.innerHTML = ''; // Limpa completamente o conteúdo
    
        // --- Adiciona TODOS os elementos DINAMICAMENTE ---
        // 1. Controles de quantidade
        optionsBody.innerHTML = `
            <div class="quantity-controls-modal">
                <button class="quantity-btn minus">-</button>
                <span class="quantity">1</span>
                <button class="quantity-btn plus">+</button>
            </div>
        `;
    
        // 2. Descrição completa
        if (item.description) {
            optionsBody.innerHTML += `
                <div class="item-full-description">
                    <h4>Descrição Completa</h4>
                    <p>${item.description}</p>
                </div>
            `;
        }
    
        // 3. Tamanhos (cria uma div temporária)
        const sizesSection = document.createElement('div');
        sizesSection.id = 'sizesSection';
        if (item.sizes && Object.keys(item.sizes).length > 0) {
            sizesSection.innerHTML = `
                <div class="options-group">
                    <h4>Tamanhos</h4>
                    ${Object.entries(item.sizes).map(([size, price]) => `
                        <label class="size-option">
                            <input type="radio" name="itemSize" value="${price}" data-size="${size}">
                            <span class="option-label">${size}</span>
                            <span class="option-price">+ R$ ${price.toFixed(2)}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        }
        optionsBody.appendChild(sizesSection);
    
        // 4. Opcionais (cria uma div temporária)
        const optionsSection = document.createElement('div');
        optionsSection.id = 'optionsSection';
        optionsSection.className = 'options-container';
        if (item.options && Object.keys(item.options).length > 0) {
            optionsSection.innerHTML = Object.entries(item.options).map(([optionName, optionData]) => `
                <div class="options-group">
                    <h4>${optionName}</h4>
                    ${optionData.items.map((optItem, index) => `
                        <label class="option-item">
                            <input type="${optionData.type}" 
                                   name="${optionName}" 
                                   value="${optItem.price}" 
                                   data-option="${optionName}"
                                   ${optionData.type === 'radio' && index === 0 ? 'checked' : ''}>
                            <span class="option-label">${optItem.name}</span>
                            <span class="option-price">+ R$ ${optItem.price.toFixed(2)}</span>
                        </label>
                    `).join('')}
                </div>
            `).join('');
        }
        optionsBody.appendChild(optionsSection);
    
        // --- Eventos ---
        // Controles de quantidade
        const minusBtn = optionsBody.querySelector('.minus');
        const plusBtn = optionsBody.querySelector('.plus');
        const quantityDisplay = optionsBody.querySelector('.quantity');
    
        minusBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                quantityDisplay.textContent = currentQuantity;
                updateSelection();
            }
        });
    
        plusBtn.addEventListener('click', () => {
            currentQuantity++;
            quantityDisplay.textContent = currentQuantity;
            updateSelection();
        });
    
        // Opções (tamanhos e adicionais)
        optionsBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', updateSelection);
        });
    
        updateSelection();
        document.getElementById('optionsModal').style.display = 'flex'; // ← Garante que o modal abre
    }
    function updateSelection() {
        const item = currentSelectedItem;
        let total = item.basePrice;

        const selectedSize = document.querySelector('input[name="itemSize"]:checked');
        if (selectedSize) {
            total += parseFloat(selectedSize.value);
            currentCalculations.selectedSizes = {
                [selectedSize.dataset.size]: parseFloat(selectedSize.value)
            };
        }

        currentCalculations.selectedOptions = {};
        document.querySelectorAll('.options-group input:checked').forEach(option => {
            if (!option.name.startsWith('itemSize')) {
                const optionName = option.dataset.option;
                const optionValue = parseFloat(option.value);

                if (item.options[optionName].type === 'checkbox') {
                    currentCalculations.selectedOptions[optionName] = currentCalculations.selectedOptions[optionName] || [];
                    currentCalculations.selectedOptions[optionName].push({
                        name: option.nextElementSibling.textContent.trim(),
                        price: optionValue
                    });
                    total += optionValue;
                } else {
                    currentCalculations.selectedOptions[optionName] = {
                        name: option.nextElementSibling.textContent.trim(),
                        price: optionValue
                    };
                    total += optionValue;
                }
            }
        });

        total *= currentQuantity;
        document.getElementById('selectedTotal').textContent = total.toFixed(2);
    }

    document.getElementById('confirmSelection').addEventListener('click', () => {
        addToCart(currentSelectedItem, currentCalculations);
        document.getElementById('optionsModal').style.display = 'none';
    });

    function addToCart(item, calculations) {
        const cartItem = {
            ...item,
            quantity: currentQuantity,
            selectedOptions: calculations.selectedOptions,
            selectedSizes: calculations.selectedSizes,
            totalPrice: parseFloat(document.getElementById('selectedTotal').textContent)
        };

        console.log('Item adicionado ao carrinho:', cartItem);
        cartCount += currentQuantity;
        cartCounter.textContent = cartCount;
    }

    document.querySelectorAll('[data-open-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-open-modal');
            document.getElementById(modalId).style.display = 'flex';
        });
    });

    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
});
