import { Product } from "./Product";

const serverUrl = "http://localhost:5000/products";

let currentIndex = 6;
const productsPerPage = 6;
let allProducts: Product[] = [];

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${serverUrl}`);
  const products: Product[] = await response.json();
  return products;
}

// CRIAR ESTRUTURA DO CARD
export function createCard(product: Product): HTMLElement {
  const productCard = document.createElement('div');
  productCard.innerHTML = `
    <div class="card" itemscope itemtype="http://schema.org/Product">
      <img src="${product.image}" alt="${product.name}" itemprop="image">
      <div class="text-center">
        <h3 itemprop="name" class="product-name uppercase">${product.name}</h3>
        
        <strong class="d-block font-16px" itemprop="offers" itemscope itemtype="http://schema.org/Offer">
          R$ <span itemprop="price">${product.price.toFixed(2).replace(".", ",")}</span>
          <meta itemprop="priceCurrency" content="BRL" />
        </strong>

        <span class="d-block font-16px color-gray-two preco-parcelado">
          até ${product.parcelamento[0]}x de R$ <span itemprop="price" content="${(product.price / product.parcelamento[0]).toFixed(2).replace(".", ",")}">${(product.price / product.parcelamento[0]).toFixed(2).replace(".", ",")}</span>
        </span>

        <button class="buy-btn" itemprop="url">COMPRAR</button>
      </div>
    </div>
  `;
  return productCard;
}


// GERAR PRODUTOS
function displayProducts(products: Product[], startIndex: number, endIndex: number): void {
  const productsContainer = document.getElementById('products');
  if (!productsContainer) return;
  productsContainer.innerHTML = '';  
  if (products.length === 0) {
    productsContainer.innerHTML = "<p class='no-products'>Sem produtos para essa seleção.</p>";
    return;
  }
  products.forEach((product, index) => {
    if (index >= startIndex && index < endIndex) {
      const productCard = createCard(product);
      productsContainer.appendChild(productCard);
    }
  });
}

// CARREGAR PRODUTOS
function loadMoreProducts() {
  const loadMoreButton = document.getElementById('load-more-btn');
  const nextIndex = currentIndex + productsPerPage;
  displayProducts(allProducts, currentIndex, nextIndex);
  currentIndex = nextIndex;

  if (currentIndex >= allProducts.length) {
    loadMoreButton.style.display = 'none';
  }
}

// ATUALIZAR URL COM FILTROS
function updateURL() {
  const params = new URLSearchParams();
 
  const selectedColors = Array.from(document.querySelectorAll('.color-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedColors.length > 0) {
    params.set('colors', selectedColors.join(','));
  }
 
  const selectedSizes = Array.from(document.querySelectorAll('.size-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedSizes.length > 0) {
    params.set('sizes', selectedSizes.join(','));
  }
 
  const selectedPriceRanges = Array.from(document.querySelectorAll('.price-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedPriceRanges.length > 0) {
    params.set('prices', selectedPriceRanges.join(','));
  }
 
  const selectedSortOption = document.querySelector('.sort-option.selected')?.getAttribute('data-value');
  if (selectedSortOption) {
    params.set('sort', selectedSortOption);
  }
 
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState(null, '', newUrl);
}


function toggleFilter(type: string, value: string) {
  const filterElements = document.querySelectorAll(`.${type}-filter`);
  filterElements.forEach(filter => {
    if (filter.getAttribute('data-value') === value) {
      filter.classList.toggle('selected');
    }
  });

  applyFilters();
  updateURL();
}

function applyFilters() {
  let filteredProducts = allProducts;
  const selectedColors = Array.from(document.querySelectorAll('.color-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedColors.length > 0) {
    filteredProducts = filteredProducts.filter(product => selectedColors.includes(product.color));
  }

  const selectedSizes = Array.from(document.querySelectorAll('.size-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedSizes.length > 0) { 
    filteredProducts = filteredProducts.filter(product => product.size.some(size => selectedSizes.includes(size)));
  }

  const selectedPriceRanges = Array.from(document.querySelectorAll('.price-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedPriceRanges.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      return selectedPriceRanges.some(range => {
        const [min, max] = range.split('-');
        const price = product.price;
        if (max === "+") {
          return price >= parseFloat(min);
        }
        return price >= parseFloat(min) && price <= parseFloat(max);
      });
    });
  }

  const selectedSortOption = document.querySelector('.sort-option.selected')?.getAttribute('data-value');
  const sortedProducts = sortProducts(selectedSortOption, filteredProducts);

  displayProducts(sortedProducts, 0, productsPerPage);
}

//CRIAR OPÇOES DE ORDENAÇÃO
function createSortOptions() { 
  const sortOptions = document.querySelectorAll('.sort-option');
  const orderOptions = document.getElementById('order-options');
  
  sortOptions.forEach(option => {
    option.addEventListener('click', () => {
      sortOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');

      if (orderOptions) {
        orderOptions.style.display = 'none';
      }

      const sortType = option.getAttribute('data-value');
      applyFilters();
      updateURL();
    });
  });
}


//ORDENAR PRODUTOS
function sortProducts(sortType: string | null, products: Product[]) {
  let sortedProducts = [...products];
  switch (sortType) {
    case 'recent':
      sortedProducts = sortedProducts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'low-price':
      sortedProducts = sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'high-price':
      sortedProducts = sortedProducts.sort((a, b) => b.price - a.price);
      break;
  } 
  return sortedProducts;
}

//CRIAR FILTROS
function createFilters(products: Product[]): void {
  const filterContainer = document.getElementById('box-filter');
  if (!filterContainer) return;
  
  const colors = Array.from(new Set(products.map(product => product.color))).sort();
  const colorFilter = document.createElement('div');
  colorFilter.innerHTML = `
    <h3 class="filter-titles">CORES</h3>
    <div class="box-options">
      ${colors.map(color => `<div data-type="color" data-value="${color}" class="color-filter filter-input">${color}</div>`).join('')} 
    </div>
  `;

  const sizes = Array.from(new Set(products.flatMap(product => product.size))).sort();
  const sizeFilter = document.createElement('div');
  sizeFilter.innerHTML = `
    <h3 class="filter-titles">TAMANHO</h3>
    <div class="box-options size">
      ${sizes.map(size => `<div data-type="size" data-value="${size}" class="size-filter filter-input">${size}</div>`).join('')}
    </div>
  `; 
  
  filterContainer.insertBefore(sizeFilter, filterContainer.firstChild); 
  filterContainer.insertBefore(colorFilter, filterContainer.firstChild);
  
  document.querySelectorAll('.filter-input').forEach(filter => {
    filter.addEventListener('click', () => {
      const filterType = filter.getAttribute('data-type');
      const selectedValue = filter.getAttribute('data-value');
      toggleFilter(filterType, selectedValue);
    });
  }); 
} 

 
//APLICAR NA URL
function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);   
  const colorsFromUrl = params.get('colors')?.split(',') || [];
  colorsFromUrl.forEach(color => toggleFilter('color', color));

  const sizesFromUrl = params.get('sizes')?.split(',') || [];
  sizesFromUrl.forEach(size => toggleFilter('size', size));

  const pricesFromUrl = params.get('prices')?.split(',') || [];
  pricesFromUrl.forEach(price => toggleFilter('price', price));

  const sortFromUrl = params.get('sort');
  
  applyFilters();
  
  let filteredProducts = allProducts;
  
  const selectedColors = Array.from(document.querySelectorAll('.color-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedColors.length > 0) {
    filteredProducts = filteredProducts.filter(product => selectedColors.includes(product.color));
  }

  const selectedSizes = Array.from(document.querySelectorAll('.size-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedSizes.length > 0) {
    filteredProducts = filteredProducts.filter(product => product.size.some(size => selectedSizes.includes(size)));
  }

  const selectedPriceRanges = Array.from(document.querySelectorAll('.price-filter.selected')).map(filter => filter.getAttribute('data-value'));
  if (selectedPriceRanges.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      return selectedPriceRanges.some(range => {
        const [min, max] = range.split('-');
        const price = product.price;
        if (max === "+") {
          return price >= parseFloat(min);
        }
        return price >= parseFloat(min) && price <= parseFloat(max);
      });
    });
  }

  // Ordenar e exibir os produtos filtrados
  if (sortFromUrl) {
    const sortedProducts = sortProducts(sortFromUrl, filteredProducts);
    displayProducts(sortedProducts, 0, productsPerPage);
  } else {
    displayProducts(filteredProducts, 0, productsPerPage);
  }
} 

//MODAL ADICIONADO
function setupSortToggle() {
  const orderTitle = document.getElementById('order-title');
  const orderOptions = document.getElementById('order-options');
  const closeOrder = document.querySelector('.close-order');  

  if (orderTitle && orderOptions) { 
    orderTitle.addEventListener('click', () => { 
      orderOptions.style.display = orderOptions.style.display === 'none' || !orderOptions.style.display ? 'block' : 'none';
    });
 
    if (closeOrder) {
      closeOrder.addEventListener('click', () => {
        orderOptions.style.display = 'none';
      });
    }
  }
}
 
function setupFilterToggle() { 
  const filterMobile = document.getElementById('filter-mobile');
  const filter = document.getElementById('filter');
  const closeFilters = filter.querySelectorAll('.close-filter');  

  if (filterMobile && filter) { 
    filterMobile.addEventListener('click', () => {
      filter.style.display = filter.style.display === 'none' || !filter.style.display ? 'block' : 'none';
    });
 
    closeFilters.forEach(closeFilter => {
      closeFilter.addEventListener('click', () => {
        filter.style.display = 'none';
      });
    });
  }
}

 
//LIMPAR FILTROS
function clearFilters() { 
  const filter = document.getElementById('filter');
  document.querySelectorAll('.filter-input.selected').forEach(filter => {
    filter.classList.remove('selected');
  });
 
  displayProducts(allProducts, 0, productsPerPage);
 
  const params = new URLSearchParams(window.location.search);
  params.delete('colors');
  params.delete('sizes');
  params.delete('prices');
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState(null, '', newUrl);
  filter.style.display = filter.style.display = 'none';
}

function setupBuyButton() {
  document.querySelectorAll('.buy-btn').forEach(button => {
    button.addEventListener('click', () => {
      const productCard = button.closest('.card');
      const productName = productCard?.querySelector('.product-name')?.textContent;

      if (!productName) return;

      const modal = document.querySelector('.modal-success') as HTMLElement;
      const nameSpan = modal.querySelector('span.name');
      nameSpan.textContent = productName;

      modal.style.display = 'block'; 
    });
  });
}

function setupModalClose() {
  const modal = document.querySelector('.modal-success') as HTMLElement;
  const closeButton = modal.querySelector('.modal-close');

  closeButton?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

function toggleTitleFilterMobile() {
  document.querySelectorAll('.filter-titles').forEach(header => {
    header.addEventListener('click', () => {
      if (window.innerWidth < 900) { 
        const optionsContainer = header.nextElementSibling; 
        if (optionsContainer && optionsContainer instanceof HTMLElement) {  
          optionsContainer.style.display = optionsContainer.style.display === 'none' || !optionsContainer.style.display ? 'flex' : 'none';
        }
      }
    });
  });
}

function main() {
  console.log(serverUrl);

  fetchProducts()
    .then(products => {
      allProducts = products;
      displayProducts(allProducts, 0, productsPerPage);
      createFilters(allProducts);
      
      createSortOptions();
      setupSortToggle(); 
      setupFilterToggle();

      const loadMoreButton = document.getElementById('load-more-btn');
      loadMoreButton?.addEventListener('click', loadMoreProducts);

      if (allProducts.length <= productsPerPage) {
        loadMoreButton.style.display = 'none';
      }

      const clearFiltersButton = document.getElementById('clear-filters-btn');
      clearFiltersButton?.addEventListener('click', clearFilters);

      applyFiltersFromURL(); // Aplica filtros ao carregar a página

      toggleTitleFilterMobile();
      setupBuyButton();
      setupModalClose();
    })
    .catch(error => {
      console.error('Erro ao buscar os produtos:', error);
    });
}

document.addEventListener("DOMContentLoaded", main);
