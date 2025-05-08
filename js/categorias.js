document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const addBtn = document.getElementById('addBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryList = document.getElementById('categoryList');
    const modal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');
    const categoryName = document.getElementById('categoryName');
    const categoryDesc = document.getElementById('categoryDesc');
    const modalTitle = document.getElementById('modalTitle');
  
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
    let categories = [];
    let currentEditingId = null;
  
    // Event Listeners
    addBtn.addEventListener('click', () => showModal());
    searchInput.addEventListener('input', (e) => filterCategories(e.target.value));
    categoryForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('cancelBtn').addEventListener('click', () => hideModal());


  
    // Carregar categorias iniciais
    categoriesRef.on('value', (snapshot) => {
        categories = [];
        const data = snapshot.val();
        if(data) {
            Object.keys(data).forEach(key => {
                categories.push({ id: key, ...data[key] });
            });
        }
        renderCategories();
    });
  
    function showModal(editData = null) {
      if(editData) {
        modalTitle.innerHTML = `<i class="fas fa-pencil-alt"></i> Editar Categoria`;
        categoryName.value = editData.name;
        categoryDesc.value = editData.description;
        currentEditingId = editData.id;
      } else {
        modalTitle.textContent = 'Nova Categoria';
        categoryForm.reset();
        currentEditingId = null;
      }
      modal.classList.remove('hidden');
    }
  
    function hideModal() {
        modal.classList.add('hidden');
        categoryForm.reset(); // Limpa os campos
        currentEditingId = null; // Reseta o ID de edição
      }
  
    // Substitua a função inteira por:
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const categoryData = {
        name: categoryName.value.trim(),
        description: categoryDesc.value.trim()
    };

    try {
        if(currentEditingId) {
            // Atualizar
            await categoriesRef.child(currentEditingId).update(categoryData);
        } else {
            // Criar novo
            await categoriesRef.push(categoryData);
        }
        hideModal();
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}
  
    function renderCategories() {
      categoryList.innerHTML = categories
        .map(cat => `
          <li class="category-item" data-id="${cat.id}">
            <div class="category-info">
              <h3>${cat.name}</h3>
              ${cat.description ? `<p>${cat.description}</p>` : ''}
            </div>
            <div class="category-actions">
              <button class="edit"><i class="fas fa-pencil-alt"></i></button>
              <button class="delete"><i class="fas fa-trash"></i></button>
            </div>
          </li>
        `).join('');
  
      // Adiciona eventos aos botões
      document.querySelectorAll('.category-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelector('.edit').addEventListener('click', () => 
          showModal(categories.find(cat => cat.id === id)));

        
        item.querySelector('.delete').addEventListener('click', () => 
          deleteCategory(id))
      });
      
    }
  
   // Substitua a função inteira por:
async function deleteCategory(id) {
    try {
        await categoriesRef.child(id).remove();
    } catch (error) {
        console.error("Erro ao deletar:", error);
    }
}
    function filterCategories(searchTerm) {
        const filtered = categories.filter(cat =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      
        categoryList.innerHTML = filtered
          .map(cat => `
            <li class="category-item" data-id="${cat.id}">
              <div class="category-info">
                <h3>${cat.name}</h3>
                ${cat.description ? `<p>${cat.description}</p>` : ''}
              </div>
              <div class="category-actions">
                <button class="edit"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete"><i class="fas fa-trash"></i></button>
              </div>
            </li>
          `).join('');
      
        // Reatribua eventos após o filtro
        document.querySelectorAll('.category-item').forEach(item => {
          const id = item.dataset.id;
          item.querySelector('.edit').addEventListener('click', () => 
            showModal(categories.find(cat => cat.id === id)));
          item.querySelector('.delete').addEventListener('click', () => 
            deleteCategory(id));
        });
      }
      
  });