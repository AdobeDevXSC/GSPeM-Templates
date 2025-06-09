import { createOptimizedPicture } from '../../scripts/aem.js';

/** Sets up a modal for previewing assets **/
export function setupPreviewModal() {
  const modalHTML = `
    <div class="tag-modal" role="dialog" aria-modal="true" aria-label="Asset preview">
      <div class="tag-modal-content" tabindex="-1">
        <button class="tag-modal-close" aria-label="Close">&times;</button>
        <div class="tag-modal-body">
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = document.querySelector('.tag-modal');
  const modalContent = modal.querySelector('.tag-modal-content');
  
  // Close handlers
  const closeModal = () => {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  };
  
  modal.querySelector('.tag-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => e.target === modal && closeModal());
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
}

/** Fetches data from the spreadsheet JSON **/
export async function fetchSpreadsheetData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json = await response.json();
    return json?.data || [];
  } catch (error) {
    console.error('Failed to fetch spreadsheet data:', error);
    return []; // Fail gracefully
  }
}

/** Enhances raw data by organizing assets into categories **/
export function enhanceDataWithAssets(data) {
  return data.map(item => {
    // Organize email assets
    const emailAssets = [
      { key: 'Email1Pod', value: item.Email1Pod },
      { key: 'Email2Pod', value: item.Email2Pod },
      { key: 'Email3Pod', value: item.Email3Pod }
    ].filter(asset => asset.value);

    // Organize display ad assets
    const displayAdAssets = [
      { key: 'DisplayAd300x600', value: item.DisplayAd300x600 },
      { key: 'DisplayAd300x250', value: item.DisplayAd300x250 },
      { key: 'DisplayAd970x250', value: item.DisplayAd970x250 }
    ].filter(asset => asset.value);

    // Organize meta ad assets
    const metaAdAssets = [
      { key: 'MetaAd1x1', value: item.MetaAd1x1 },
      { key: 'MetaAd4x5', value: item.MetaAd4x5 },
      { key: 'MetaAd9x16', value: item.MetaAd9x16 }
    ].filter(asset => asset.value);

    return {
      ...item,
      emailAssets,
      displayAdAssets,
      metaAdAssets,
      // Add filterable categories
      categories: [
        ...(item.Email === 'true' ? ['email'] : []),
        ...(item.DisplayAd === 'true' ? ['display-ad'] : []),
        ...(item.MetaAd === 'true' ? ['meta-ad'] : [])
      ]
    };
  });
}

/** Creates template cards and adds them to the block **/
export function createTemplateCards(block, data, page = 1, itemsPerPage = 8) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const cardsList = document.createElement('ul');
  cardsList.className = 'templates-grid';

  if (paginatedData.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = 'No templates found matching your criteria.';
    cardsList.appendChild(noResults);
  } else {
    paginatedData.forEach(item => {
      const card = createTemplateCard(item);
      cardsList.appendChild(card);
    });
  }

  // Clear existing cards
  const existingGrid = block.querySelector('.templates-grid');
  if (existingGrid) existingGrid.remove();

  block.appendChild(cardsList);
  
  // Return whether there are more items
  return endIndex < data.length;
}

/** Creates a single template card element **/
function createTemplateCard(item) {
  const hasEmail = item.Email === 'true';
  const hasDisplayAd = item.DisplayAd === 'true';
  const hasMetaAd = item.MetaAd === 'true';

  // Create optimized main image
  const optimizedMainImage = createOptimizedPicture(
    item.MainImage,
    item.Opportunity,
    true,
    [{ width: '350' }]
  );

  // Create card HTML
  const card = document.createElement('li');
  card.className = 'template-card';
  card.dataset.categories = item.categories.join(' ');
  
  card.innerHTML = `
    <div class="cards-card-image-flip">
      <div class="flip-inner">
        <div class="flip-front">
          ${optimizedMainImage.outerHTML}
        </div>
        <div class="flip-back">
          <div class="resources">
            <a href="${item.GitHub}" title="GitHub" target="_blank" rel="noopener noreferrer">
              <img src="/icons/github-logo.svg" alt="GitHub" width="60" height="60">
            </a>
            <div class="templates-container">
              ${createAssetSection('Email', item.emailAssets)}
              ${createAssetSection('Display Ad', item.displayAdAssets)}
              ${createAssetSection('Meta Ad', item.metaAdAssets)}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="cards-card-body">
      <p>${item.Opportunity}</p>
      <div class="tags">
        ${hasEmail ? '<span class="tag tag-email">Email</span>' : ''}
        ${hasDisplayAd ? '<span class="tag tag-display-ad">Display Ad</span>' : ''}
        ${hasMetaAd ? '<span class="tag tag-meta-ad">Meta Ad</span>' : ''}
      </div>
    </div>
  `;

  // Add flip interaction
  setupCardFlipInteraction(card);
  // Add tag click handlers for preview
  setupTagPreviewInteractions(card);

  return card;
}

/** Creates HTML for an asset type section **/
function createAssetSection(title, assets) {
  if (!assets.length) return '';
  
  return `
    <div class="template-type">
      ${title}
      <div class="tags">
        ${assets.map(asset => `
          <span class="tag tag-${title.toLowerCase().replace(' ', '-')}" 
                title="${asset.key}" 
                data-src="${asset.value}">
            ${asset.key}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

/** Sets up flip interaction for a card **/
function setupCardFlipInteraction(card) {
  let flipTimeout;
  
  card.addEventListener('click', () => {
    clearTimeout(flipTimeout);
    flipTimeout = setTimeout(() => {
      const allFlipped = document.querySelectorAll('.flip-inner.flipped');
      allFlipped.forEach(flipped => {
        if (flipped !== card.querySelector('.flip-inner')) {
          flipped.classList.remove('flipped');
        }
      });

      const flipContainer = card.querySelector('.flip-inner');
      flipContainer.classList.toggle('flipped');
    }, 100); // Small delay to prevent accidental flips
  });
}

/** Sets up preview modal interactions for tags **/
function setupTagPreviewInteractions(card) {
  card.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      showAssetPreview(tag.title, tag.dataset.src);
    });
  });
}

/** Shows an asset preview in the modal **/
function showAssetPreview(title, src) {
  const modal = document.querySelector('.tag-modal');
  const modalBody = modal.querySelector('.tag-modal-body');
  
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(src);
  
  modalBody.innerHTML = `
    <h3>${title}</h3>
    ${isImage ? `
      <img src="${src}" 
           alt="${title}" 
           loading="eager"
           decoding="async"
           width="600"
           height="400"
           style="max-width: 100%; margin-top: 1em;">
    ` : '<p><em>Preview unavailable</em></p>'}
  `;
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.tag-modal-content').focus();
}

// In createFilterControls() - Remove apply/reset buttons and add event listeners
export function createFilterControls(block, data, onFilterChange) {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'templates-filters';
  
  filterContainer.innerHTML = `
    <div class="filter-section">
      <h5>Template Type</h5>
      <div class="filter-options">
        <label>
          <input type="checkbox" name="filter" value="email" checked> Email
        </label>
        <label>
          <input type="checkbox" name="filter" value="display-ad" checked> Display Ad
        </label>
        <label>
          <input type="checkbox" name="filter" value="meta-ad" checked> Meta Ad
        </label>
      </div>
    </div>
  `;
  
  // Add event listeners to checkboxes
  filterContainer.querySelectorAll('input[name="filter"]').forEach(checkbox => {
    checkbox.addEventListener('change', onFilterChange);
  });
  
  block.prepend(filterContainer);
}

/** Creates pagination controls **/
export function createPaginationControls(block, data, currentPage, itemsPerPage, hasMore) {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'templates-pagination';
  
  paginationContainer.innerHTML = `
    <div class="pagination-info">
      Showing ${Math.min(data.length, currentPage * itemsPerPage)} of ${data.length} templates
    </div>
    <div class="pagination-controls">
      <button class="pagination-prev" ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      <span class="pagination-page">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-next" ${!hasMore ? 'disabled' : ''}>
        Next
      </button>
    </div>
  `;
  
  block.appendChild(paginationContainer);
}

/** Creates error message HTML */
export function createErrorMessage(spreadsheetLink) {
  return `
    <div class="templates-error">
      <p>Failed to load templates.</p>
      ${spreadsheetLink ? `<a href="${spreadsheetLink}" target="_blank">View data source</a>` : ''}
    </div>
  `;
}

/** Handles pagination rendering and event setup */
export function setupPagination(contentArea, filteredData, currentPage, itemsPerPage, renderCallback) {
  const hasMore = createTemplateCards(contentArea, filteredData, currentPage, itemsPerPage);
  
  if (filteredData.length > 0) {
    createPaginationControls(contentArea, filteredData, currentPage, itemsPerPage, hasMore);
    
    contentArea.querySelector('.pagination-prev')?.addEventListener('click', () => {
      if (currentPage > 1) {
        renderCallback(currentPage - 1);
      }
    });
    
    contentArea.querySelector('.pagination-next')?.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredData.length / itemsPerPage);
      if (currentPage < totalPages) {
        renderCallback(currentPage + 1);
      }
    });
  }
}

/** Creates the main container structure */
export function createTemplateContainer(block) {
  const container = document.createElement('div');
  container.className = 'templates-container';
  block.appendChild(container);
  
  const contentArea = document.createElement('div');
  contentArea.className = 'templates-content';
  container.appendChild(contentArea);
  
  return { container, contentArea };
}