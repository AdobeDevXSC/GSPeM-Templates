import { createOptimizedPicture } from '../../scripts/aem.js';

/** Sets up a modal for previewing assets **/
export function setupPreviewModal() {
  const modalHTML = `
    <div class="tag-modal">
      <div class="tag-modal-content">
        <span class="tag-modal-close">&times;</span>
        <div class="tag-modal-body">
          <p>Loading...</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Close modal when clicking the close button
  const modal = document.querySelector('.tag-modal');
  modal.querySelector('.tag-modal-close').addEventListener('click', () => {
    modal.classList.remove('show');
    modal.querySelector('.tag-modal-body').innerHTML = '<p>Loading...</p>';
  });
}

/** Fetches data from the spreadsheet JSON **/
export async function fetchSpreadsheetData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch data');
  const json = await response.json();
  return json?.data || [];
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
      metaAdAssets
    };
  });
}

/** Creates template cards and adds them to the block **/
export function createTemplateCards(block, data) {
  const cardsList = document.createElement('ul');

  data.forEach(item => {
    const card = createTemplateCard(item);
    cardsList.appendChild(card);
  });

  block.appendChild(cardsList);
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
  card.innerHTML = `
    <div class="cards-card-image-flip">
      <div class="flip-inner">
        <div class="flip-front">
          ${optimizedMainImage.outerHTML}
        </div>
        <div class="flip-back">
          <div class="resources">
            <a href="${item.GitHub}" title="GitHub" target="_blank">
              <img src="/icons/github-logo.svg" alt="GitHub">
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
        ${hasDisplayAd ? '<span class="tag tag-display">Display Ad</span>' : ''}
        ${hasMetaAd ? '<span class="tag tag-meta">Meta Ad</span>' : ''}
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
  card.addEventListener('click', () => {
    const allFlipped = document.querySelectorAll('.flip-inner.flipped');
    allFlipped.forEach(flipped => {
      if (flipped !== card.querySelector('.flip-inner')) {
        flipped.classList.remove('flipped');
      }
    });

    const flipContainer = card.querySelector('.flip-inner');
    flipContainer.classList.toggle('flipped');
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
           style="max-width: 100%; margin-top: 1em;">
    ` : '<p><em>Preview unavailable</em></p>'}
  `;
  
  modal.classList.add('show');
}
