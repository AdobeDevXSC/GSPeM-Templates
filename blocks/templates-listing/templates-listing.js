import { 
  setupPreviewModal,
  fetchSpreadsheetData,
  enhanceDataWithAssets,
  createTemplateCards,
  createFilterControls,
  createErrorMessage,
  setupPagination,
  createTemplateContainer
} from './support-functions.js';

export default async function decorate(block) {
  const spreadsheetLink = block.querySelector('a')?.href;
  block.textContent = ''; // Clear the block content

  setupPreviewModal();
  if (!spreadsheetLink) return;

  try {
    const rawData = await fetchSpreadsheetData(spreadsheetLink);
    const enhancedData = enhanceDataWithAssets(rawData);
    
    const { container, contentArea } = createTemplateContainer(block);
    
    let currentPage = 1;
    const itemsPerPage = 8;
    let filteredData = [...enhancedData];
    
    const handleFilterChange = () => {
      const checkboxes = container.querySelectorAll('input[name="filter"]:checked');
      const activeFilters = Array.from(checkboxes).map(cb => cb.value);
      
      filteredData = enhancedData.filter(item => 
        activeFilters.some(filter => item.categories.includes(filter))
      );
      
      renderTemplates(1); // Reset to first page when filters change
    };
    
    const renderTemplates = (page) => {
      currentPage = page;
      // Clear existing content
      contentArea.innerHTML = '';
      
      createTemplateCards(contentArea, filteredData, currentPage, itemsPerPage);
      setupPagination(contentArea, filteredData, currentPage, itemsPerPage, renderTemplates);
    };
    
    createFilterControls(container, enhancedData, handleFilterChange);
    renderTemplates(currentPage);
    
  } catch (error) {
    console.error('Error loading template data:', error);
    block.innerHTML = createErrorMessage(spreadsheetLink);
  }
}
