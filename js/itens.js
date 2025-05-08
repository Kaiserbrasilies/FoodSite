document.addEventListener('DOMContentLoaded', () => {
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

    const categorySelect = document.getElementById('categorySelect');
    let selectedCategoryId = null;
    let itemsRef = null;

    const itemsList = document.getElementById('itemsList');
    const itemModal = document.getElementById('itemModal');
    const itemForm = document.getElementById('itemForm');
    const categoryTitle = document.getElementById('categoryTitle');
    let currentEditingItemId = null;

    // Variáveis para a imagem
    const itemImageInput = document.getElementById('itemImage');
    const imagePreview = document.getElementById('imagePreview');
    let currentImageBase64 = null;

    // Evento para pré-visualização da imagem
    itemImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 3MB!');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.style.display = 'block';
                imagePreview.src = event.target.result;
                currentImageBase64 = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    async function loadCategories() {
        const categoriesRef = database.ref('categories');
        categoriesRef.on('value', snapshot => {
            categorySelect.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
            const categories = snapshot.val();
            if (categories) {
                Object.keys(categories).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = categories[key].name;
                    categorySelect.appendChild(option);
                });
            }
        });
    }

    categorySelect.addEventListener('change', (e) => {
        selectedCategoryId = e.target.value;
        if (selectedCategoryId) {
            itemsRef = database.ref(`categories/${selectedCategoryId}/items`);
            loadItems();
            database.ref(`categories/${selectedCategoryId}`).once('value').then(snapshot => {
                categoryTitle.textContent = `📦 ${snapshot.val().name}`;
            });
        } else {
            itemsList.innerHTML = '';
            categoryTitle.textContent = '📦 Selecione uma categoria';
        }
    });

    function loadItems() {
        if (!itemsRef) return;
        itemsRef.on('value', snapshot => {
            itemsList.innerHTML = '';
            const items = snapshot.val();
            if (items) {
                Object.keys(items).forEach(key => {
                    const item = items[key];
                    const li = document.createElement('li');
                    li.className = 'category-item';
                    li.innerHTML = `
                        <div class="category-info">
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="max-width: 100px; margin-bottom: 1rem;">` : ''}
                            <h3>${item.name}</h3>
                            <p>${item.description || ''}</p>
                            <small>Preço base: R$ ${item.basePrice.toFixed(2)}</small>
                        </div>
                        <div class="category-actions">
                            <button class="edit"><i class="fas fa-pencil-alt"></i></button>
                            <button class="delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    li.querySelector('.edit').addEventListener('click', () => editItem(key, item));
                    li.querySelector('.delete').addEventListener('click', () => deleteItem(key));
                    itemsList.appendChild(li);
                });
            }
        });
    }

    document.getElementById('addItemBtn').addEventListener('click', () => {
        if (!selectedCategoryId) {
            alert('Selecione uma categoria primeiro!');
            return;
        }
        showItemModal();
    });

    document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'categorias.html');
    document.getElementById('cancelItemBtn').addEventListener('click', () => hideItemModal());
    document.getElementById('addSize').addEventListener('click', () => addSizeField());
    document.getElementById('addOption').addEventListener('click', () => addOptionField());
    itemForm.addEventListener('submit', handleItemSubmit);

    function showItemModal(itemData = null) {
        currentEditingItemId = itemData?.id || null;
        document.getElementById('itemModalTitle').textContent = itemData ? 'Editar Item' : 'Novo Item';

        // Reset da imagem
        itemImageInput.value = '';
        imagePreview.style.display = 'none';
        currentImageBase64 = null;

        if (itemData) {
            document.getElementById('itemName').value = itemData.name;
            document.getElementById('itemDescription').value = itemData.description || '';
            document.getElementById('itemBasePrice').value = itemData.basePrice;
            document.getElementById('meiaMeia').checked = itemData.combinationRules?.meiaMeia || false;
            document.querySelector(`input[name="calculationType"][value="${itemData.combinationRules?.calculationType || 'average'}"]`).checked = true;

            document.getElementById('sizesContainer').innerHTML = '';
            if (itemData.sizes) {
                Object.entries(itemData.sizes).forEach(([size, price]) => {
                    addSizeField(size, price);
                });
            }

            document.getElementById('optionsContainer').innerHTML = '';
            if (itemData.options) {
                Object.entries(itemData.options).forEach(([option, data]) => {
                    addOptionField(data.type, option, data.items[0].price);
                });
            }

            if (itemData.image) {
                imagePreview.style.display = 'block';
                imagePreview.src = itemData.image;
                currentImageBase64 = itemData.image;
            }
        } else {
            itemForm.reset();
            document.getElementById('sizesContainer').innerHTML = '';
            document.getElementById('optionsContainer').innerHTML = '';
        }

        itemModal.classList.remove('hidden');
    }

    function hideItemModal() {
        itemModal.classList.add('hidden');
        currentEditingItemId = null;
    }

    function addSizeField(sizeName = '', price = '') {
        const div = document.createElement('div');
        div.className = 'size-option';
        div.innerHTML = `
            <input type="text" placeholder="Tamanho" value="${sizeName}">
            <input type="number" step="0.01" placeholder="Preço" value="${price}">
            <button class="remove-field"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-field').addEventListener('click', () => div.remove());
        document.getElementById('sizesContainer').appendChild(div);
    }

    function addOptionField(type = 'checkbox', optionName = '', price = '') {
        const div = document.createElement('div');
        div.className = 'size-option';
        div.innerHTML = `
            <select class="option-type">
                <option value="checkbox" ${type === 'checkbox' ? 'selected' : ''}>Múltipla Escolha</option>
                <option value="radio" ${type === 'radio' ? 'selected' : ''}>Única Escolha</option>
            </select>
            <input type="text" placeholder="Nome do opcional" value="${optionName}">
            <input type="number" step="0.01" placeholder="Preço adicional" value="${price}">

            <button class="remove-field"><i class="fas fa-times"></i></button>
        `;
        div.querySelector('.remove-field').addEventListener('click', () => div.remove());
        document.getElementById('optionsContainer').appendChild(div);
    }

    async function handleItemSubmit(e) {
        e.preventDefault();
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            description: document.getElementById('itemDescription').value.trim(),
            basePrice: parseFloat(document.getElementById('itemBasePrice').value),
            sizes: {},
            options: {},
            combinationRules: {
                meiaMeia: document.getElementById('meiaMeia').checked,
                calculationType: document.querySelector('input[name="calculationType"]:checked').value
            },
            image: currentImageBase64 || null
        };

        document.querySelectorAll('#sizesContainer .size-option').forEach(option => {
            const inputs = option.querySelectorAll('input');
            const sizeName = inputs[0].value.trim();
            const price = parseFloat(inputs[1].value);
            if (sizeName && !isNaN(price)) {
                itemData.sizes[sizeName] = price;
            }
        });

        document.querySelectorAll('#optionsContainer .size-option').forEach(option => {
            const type = option.querySelector('.option-type').value;
            const inputs = option.querySelectorAll('input');
            const optionName = inputs[0].value.trim();
            const price = parseFloat(inputs[1].value);
            if (optionName && !isNaN(price)) {
                itemData.options[optionName] = {
                    type: type,
                    items: [{ name: optionName, price: price }]
                };
            }
        });

        try {
            if (currentEditingItemId) {
                await itemsRef.child(currentEditingItemId).update(itemData);
            } else {
                await itemsRef.push(itemData);
            }
            hideItemModal();
        } catch (error) {
            console.error("Erro ao salvar item:", error);
        }
    }

    function editItem(itemId, itemData) {
        itemData.id = itemId;
        showItemModal(itemData);
    }

    async function deleteItem(itemId) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await itemsRef.child(itemId).remove();
            } catch (error) {
                console.error("Erro ao excluir item:", error);
            }
        }
    }

    loadCategories();
});
