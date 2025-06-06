/* eslint-disable */
import { 
  setupPreviewModal,
  fetchSpreadsheetData,
  enhanceDataWithAssets,
  createTemplateCards
} from './support-functions.js';

export default async function decorate(block) {
  // 1. Get the spreadsheet link from the block's first anchor tag
  const spreadsheetLink = block.querySelector('a')?.href;
  block.textContent = ''; // Clear the block content

  // 2. Create and setup the modal for displaying asset previews
  setupPreviewModal();

  // 3. Only proceed if we have a valid spreadsheet link
  if (!spreadsheetLink) return;

  try {
    // 4. Fetch and process the data
    const rawData = await fetchSpreadsheetData(spreadsheetLink);
    const enhancedData = enhanceDataWithAssets(rawData);
    
    // 5. Create and display the cards
    createTemplateCards(block, enhancedData);
  } catch (error) {
    console.error('Error loading template data:', error);
    block.textContent = 'Failed to load templates. Please try again later.';
  }
}
