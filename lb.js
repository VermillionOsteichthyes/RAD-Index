// Filter order definitions for each category
const filterOrders = {
  raids: ["All Raids", "The Desert Perpetual (Epic)", "The Desert Perpetual", "Salvation's Edge", "Crota's End", "Root of Nightmares", "King's Fall", "Vow of the Disciple", "Vault of Glass", "Deep Stone Crypt", "Garden of Salvation", "Last Wish", "Crown of Sorrow", "Scourge of the Past", "Spire of Stars", "Eater of Worlds", "Leviathan"],
  dungeons: ["All Dungeons", "Equilibrium", "Sundered Doctrine", "Vesper's Host", "Warlord's Ruin", "Ghosts of the Deep", "Spire of the Watcher", "Duality", "Grasp of Avarice", "Prophecy", "Pit of Heresy", "Shattered Throne", "Presage", "Harbinger", "Zero Hour", "The Whisper"],
  mode: ["Challenge", "Contest", "Master", "Normal", "Ultimatum", "Heroic", "1 Feat", "2 Feats", "3 Feats", "4 Feats", "5 Feats"],
  type: ["Full Clears", "Clears", "Fastest Time", "Average Time", "Sherpas", "World's First", "Total Time", "Kills", "Deaths", "Assists"],
  "fireteam-size": ["1", "2", "3", "4", "5", "6"],
  "time-period": ["All Time", "Past Week", "Past Month", "Seasonal", "Custom Date"],
  platform: ["Steam", "Xbox", "PlayStation", "Epic Games"]
};

// Category order for active filters (raids first, then dungeons)
const activeFilterCategoryOrder = ["raids", "dungeons", "mode", "type", "fireteam-size", "time-period", "platform"];

// Filter state management
const filterState = {
  active: new Map(), // category -> Set of values
  available: new Map() // category -> Set of values
};

// Initialize available filters from DOM
function initializeAvailableFilters() {
  document.querySelectorAll('.filter-options-list').forEach(list => {
    const category = list.dataset.category;
    const values = new Set();
    const domBubbles = list.querySelectorAll('.available-filter-bubble');
    
    domBubbles.forEach(bubble => {
      const value = bubble.dataset.value;
      // Exclude values that are already in active filters
      const activeValues = filterState.active.get(category);
      if (!activeValues || !activeValues.has(value)) {
        values.add(value);
      } else {
        // If this value is active, remove the bubble from DOM to prevent duplicates
        bubble.remove();
      }
    });
    filterState.available.set(category, values);
  });
}

// Initialize active filters from DOM
function initializeActiveFilters() {
  document.querySelectorAll('.active-filter-bubble').forEach(bubble => {
    const category = bubble.dataset.category;
    const value = bubble.dataset.value;
    const isSeasonal = bubble.dataset.isSeasonal === 'true';
    const isCustomDate = bubble.dataset.isCustomDate === 'true';
    
    if (!filterState.active.has(category)) {
      filterState.active.set(category, new Set());
    }
    filterState.active.get(category).add(value);
    
    // Restore selected seasons if this is a seasonal filter
    if (isSeasonal && bubble.dataset.seasons) {
      const seasonsArray = bubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
      selectedSeasons = new Set(seasonsArray);
    }
    
    // Restore custom dates if this is a custom date filter
    if (isCustomDate && bubble.dataset.startDate && bubble.dataset.endDate) {
      const startDate = parseDateISO(bubble.dataset.startDate);
      const endDate = parseDateISO(bubble.dataset.endDate);
      customStartDate = startDate;
      customEndDate = endDate;
    }
  });
}

// Toggle filter categories visibility
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterCategoriesGrid = document.getElementById('filterCategoriesGrid');
const filterApplyBtn = document.getElementById('filterApplyBtn');

filterToggleBtn.addEventListener('click', () => {
  const isVisible = filterCategoriesGrid.style.display !== 'none';
  filterCategoriesGrid.style.display = isVisible ? 'none' : 'grid';
  filterToggleBtn.textContent = isVisible ? 'Show filters' : 'Hide filters';
  filterApplyBtn.style.display = isVisible ? 'none' : 'block';
});

filterApplyBtn.addEventListener('click', () => {
  // Load leaderboard with current active filters
  loadLeaderboard();
  
  // Close the filters menu (same as clicking Hide filters)
  filterCategoriesGrid.style.display = 'none';
  filterToggleBtn.textContent = 'Show filters';
  filterApplyBtn.style.display = 'none';
});

// Seasonal filter state
let selectedSeasons = new Set(); // Persistent across modal opens/closes
const TOTAL_SEASONS = 24; // Configurable number of seasons

// Handle clicking available filter bubbles
document.querySelectorAll('.available-filter-bubble').forEach(bubble => {
  bubble.addEventListener('click', () => {
    const category = bubble.closest('.filter-options-list').dataset.category;
    const value = bubble.dataset.value;

    // Special handling for Seasonal filter - open modal instead of adding directly
    if (value === 'Seasonal' && category === 'time-period') {
      openSeasonalModal();
      return;
    }

    // Special handling for Custom Date filter - open modal instead of adding directly
    if (value === 'Custom Date' && category === 'time-period') {
      openCustomDateModal();
      return;
    }

    // Special handling for type filters - only one can be active at a time
    if (category === 'type') {
      // Remove any existing active type filter
      const activeTypeFilters = document.querySelectorAll('.active-filter-bubble[data-category="type"]');
      activeTypeFilters.forEach(activeBubble => {
        const activeValue = activeBubble.dataset.value;
        activeBubble.remove();
        filterState.active.get('type')?.delete(activeValue);
        if (!filterState.available.has('type')) {
          filterState.available.set('type', new Set());
        }
        filterState.available.get('type').add(activeValue);
        restoreAvailableFilter('type', activeValue);
      });
    }

    // Special handling for time-period filters - only one can be active at a time
    if (category === 'time-period') {
      // Remove any existing active time-period filter
      const activeTimePeriodFilters = document.querySelectorAll('.active-filter-bubble[data-category="time-period"]');
      activeTimePeriodFilters.forEach(activeBubble => {
        const activeValue = activeBubble.dataset.value;
        const isSeasonal = activeBubble.dataset.isSeasonal === 'true';
        const isCustomDate = activeBubble.dataset.isCustomDate === 'true';
        
        activeBubble.remove();
        filterState.active.get('time-period')?.delete(activeValue);
        if (!filterState.available.has('time-period')) {
          filterState.available.set('time-period', new Set());
        }
        
        // Preserve state for seasonal and custom date filters
        if (isSeasonal && activeBubble.dataset.seasons) {
          const seasonsArray = activeBubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
          selectedSeasons = new Set(seasonsArray);
          filterState.available.get('time-period').add('Seasonal');
          restoreAvailableFilter('time-period', 'Seasonal');
        } else if (isCustomDate && activeBubble.dataset.startDate && activeBubble.dataset.endDate) {
          const startDate = parseDateISO(activeBubble.dataset.startDate);
          const endDate = parseDateISO(activeBubble.dataset.endDate);
          customStartDate = startDate;
          customEndDate = endDate;
          filterState.available.get('time-period').add('Custom Date');
          restoreAvailableFilter('time-period', 'Custom Date');
        } else {
          filterState.available.get('time-period').add(activeValue);
          restoreAvailableFilter('time-period', activeValue);
        }
      });
    }

    // Remove from available list
    bubble.remove();

    // Update state
    if (!filterState.active.has(category)) {
      filterState.active.set(category, new Set());
    }
    filterState.active.get(category).add(value);
    filterState.available.get(category)?.delete(value);

    // Add to active filters
    addActiveFilter(category, value);
  });
});

// Add hover effects for type filters
function setupTypeFilterHovers() {
  const typeFilterList = document.querySelector('.filter-options-list[data-category="type"]');
  if (!typeFilterList) return;

  const typeBubbles = typeFilterList.querySelectorAll('.available-filter-bubble');
  typeBubbles.forEach(bubble => {
    bubble.addEventListener('mouseenter', () => {
      // Find active type filter and add glow class
      const activeTypeFilter = document.querySelector('.active-filter-bubble[data-category="type"]');
      if (activeTypeFilter) {
        activeTypeFilter.classList.add('type-filter-will-replace');
      }
    });

    bubble.addEventListener('mouseleave', () => {
      // Remove glow class from active type filter
      const activeTypeFilter = document.querySelector('.active-filter-bubble[data-category="type"]');
      if (activeTypeFilter) {
        activeTypeFilter.classList.remove('type-filter-will-replace');
      }
    });
  });
}

// Add hover effects for time-period filters
function setupTimePeriodFilterHovers() {
  const timePeriodFilterList = document.querySelector('.filter-options-list[data-category="time-period"]');
  if (!timePeriodFilterList) return;

  const timePeriodBubbles = timePeriodFilterList.querySelectorAll('.available-filter-bubble');
  timePeriodBubbles.forEach(bubble => {
    bubble.addEventListener('mouseenter', () => {
      // Find active time-period filter and add glow class
      const activeTimePeriodFilter = document.querySelector('.active-filter-bubble[data-category="time-period"]');
      if (activeTimePeriodFilter) {
        activeTimePeriodFilter.classList.add('type-filter-will-replace');
      }
    });

    bubble.addEventListener('mouseleave', () => {
      // Remove glow class from active time-period filter
      const activeTimePeriodFilter = document.querySelector('.active-filter-bubble[data-category="time-period"]');
      if (activeTimePeriodFilter) {
        activeTimePeriodFilter.classList.remove('type-filter-will-replace');
      }
    });
  });
}

// Setup type filter hovers on page load and when filters are restored
setupTypeFilterHovers();
setupTimePeriodFilterHovers();

// Handle clicking anywhere on active filter bubbles
document.addEventListener('click', (e) => {
  const bubble = e.target.closest('.active-filter-bubble');
  if (bubble) {
    const category = bubble.dataset.category;
    const value = bubble.dataset.value;
    const isSeasonal = bubble.dataset.isSeasonal === 'true';
    const isCustomDate = bubble.dataset.isCustomDate === 'true';

    // Remove from active filters
    bubble.remove();

    // Update state
    filterState.active.get(category)?.delete(value);
    if (!filterState.available.has(category)) {
      filterState.available.set(category, new Set());
    }
    
    // For seasonal filters, preserve selected seasons state and restore as "Seasonal"
    if (isSeasonal && bubble.dataset.seasons) {
      // Restore selected seasons from data attribute
      const seasonsArray = bubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
      selectedSeasons = new Set(seasonsArray);
      filterState.available.get(category).add('Seasonal');
      restoreAvailableFilter(category, 'Seasonal');
    } else if (isCustomDate && bubble.dataset.startDate && bubble.dataset.endDate) {
      // For custom date filters, preserve selected dates state and restore as "Custom Date"
      const startDate = parseDateISO(bubble.dataset.startDate);
      const endDate = parseDateISO(bubble.dataset.endDate);
      customStartDate = startDate;
      customEndDate = endDate;
      filterState.available.get(category).add('Custom Date');
      restoreAvailableFilter(category, 'Custom Date');
    } else {
      filterState.available.get(category).add(value);
      restoreAvailableFilter(category, value);
    }
    
    // Update data-range and fireteam-size text if relevant filters were removed
    if (category === 'time-period') {
      updateDataRange();
    } else if (category === 'fireteam-size') {
      updateFireteamSize();
    }
    
    // Update leaderboard title
    updateLeaderboardTitle();
  }
});

// Update data-range text based on active time-period filter
function updateDataRange() {
  const dataRangeEl = document.querySelector('.data-range');
  if (!dataRangeEl) return;
  
  const activeTimePeriodFilters = filterState.active.get('time-period');
  if (activeTimePeriodFilters && activeTimePeriodFilters.size > 0) {
    // Get the first (and only) time-period filter value
    const timePeriodValue = Array.from(activeTimePeriodFilters)[0];
    // Display the filter value directly (it will be formatted like "Past Week", "Seasonal: S1, S2", "Custom Date: YYYY-MM-DD - YYYY-MM-DD", etc.)
    dataRangeEl.textContent = timePeriodValue;
  } else {
    // Default to "All Time" if no time-period filter is active
    dataRangeEl.textContent = 'All Time';
  }
}

// Update fireteam-size text based on active fireteam-size filters
function updateFireteamSize() {
  const fireteamSizeEl = document.querySelector('.fireteam-size');
  if (!fireteamSizeEl) return;
  
  const activeFireteamSizeFilters = filterState.active.get('fireteam-size');
  if (activeFireteamSizeFilters && activeFireteamSizeFilters.size > 0) {
    // Get all active fireteam sizes and sort them
    const sizes = Array.from(activeFireteamSizeFilters).sort((a, b) => parseInt(a) - parseInt(b));
    // Format as "Fireteam Size: X, Y, Z, ..."
    fireteamSizeEl.textContent = `Fireteam Size: ${sizes.join(', ')}`;
  } else {
    // Default or empty state - you might want to show something else here
    fireteamSizeEl.textContent = 'Fireteam Size: All';
  }
}

// Update leaderboard title based on active filters
function updateLeaderboardTitle() {
  // Step 1: Check if any category has > 1 filter
  for (const [category, values] of filterState.active) {
    if (values.size > 1) {
      setTitle("Custom Leaderboard");
      return;
    }
  }
  
  // Step 2: Determine Activity
  const raidsCount = filterState.active.get('raids')?.size || 0;
  const dungeonsCount = filterState.active.get('dungeons')?.size || 0;
  const totalActivityFilters = raidsCount + dungeonsCount;
  
  let activity;
  if (totalActivityFilters === 0) {
    activity = "All Raids and Dungeons";
  } else if (totalActivityFilters === 1) {
    if (raidsCount === 1) {
      activity = Array.from(filterState.active.get('raids'))[0];
    } else {
      activity = Array.from(filterState.active.get('dungeons'))[0];
    }
  } else {
    setTitle("Custom Leaderboard");
    return;
  }
  
  // Step 3: Determine Mode (default blank)
  const modeFilters = filterState.active.get('mode');
  const mode = (modeFilters && modeFilters.size === 1) 
    ? Array.from(modeFilters)[0] 
    : "";
  
  // Step 4: Determine Type (default "Full Clears")
  const typeFilters = filterState.active.get('type');
  const type = (typeFilters && typeFilters.size === 1)
    ? Array.from(typeFilters)[0]
    : "Full Clears";
  
  // Step 5: Build and set title
  const title = activity + (mode ? " " + mode : "") + " " + type;
  setTitle(title);
}

// Helper function to set both h1 and title elements
function setTitle(titleText) {
  const h1Element = document.querySelector('.title-section h1');
  const titleElement = document.querySelector('title');
  
  if (h1Element) {
    h1Element.textContent = titleText;
  }
  
  if (titleElement) {
    titleElement.textContent = titleText + " - RADIndex";
  }
}

// Add active filter bubble in correct position
function addActiveFilter(category, value) {
  const activeFiltersList = document.getElementById('activeFiltersList');
  const bubble = document.createElement('div');
  bubble.className = 'active-filter-bubble';
  bubble.dataset.category = category;
  bubble.dataset.value = value;
  bubble.innerHTML = `
    <span class="filter-text">${value}</span>
    <span class="filter-remove">×</span>
  `;

  // Find the correct insertion position
  // raids should come first, then others in category order
  const categoryIndex = activeFilterCategoryOrder.indexOf(category);
  const existingBubbles = Array.from(activeFiltersList.children);
  
  let insertIndex = existingBubbles.length;
  
  // Find where to insert based on category order
  for (let i = 0; i < existingBubbles.length; i++) {
    const existingCategory = existingBubbles[i].dataset.category;
    const existingCategoryIndex = activeFilterCategoryOrder.indexOf(existingCategory);
    
    if (categoryIndex < existingCategoryIndex) {
      insertIndex = i;
      break;
    } else if (categoryIndex === existingCategoryIndex) {
      // Same category - find position based on filter order
      const order = filterOrders[category] || [];
      const valueIndex = order.indexOf(value);
      const existingValue = existingBubbles[i].dataset.value;
      const existingValueIndex = order.indexOf(existingValue);
      
      if (valueIndex < existingValueIndex) {
        insertIndex = i;
        break;
      }
    }
  }
  
  // Insert at the correct position
  if (insertIndex < existingBubbles.length) {
    activeFiltersList.insertBefore(bubble, existingBubbles[insertIndex]);
  } else {
    activeFiltersList.appendChild(bubble);
  }
  
  // Update data-range and fireteam-size text if relevant filters changed
  if (category === 'time-period') {
    updateDataRange();
  } else if (category === 'fireteam-size') {
    updateFireteamSize();
  }
  
  // Update leaderboard title
  updateLeaderboardTitle();
}

// Restore filter to available list in correct position
function restoreAvailableFilter(category, value) {
  const categoryList = document.querySelector(`.filter-options-list[data-category="${category}"]`);
  if (!categoryList) return;

  const bubble = document.createElement('div');
  bubble.className = 'available-filter-bubble';
  // Add special class for seasonal filter trigger
  if (value === 'Seasonal' && category === 'time-period') {
    bubble.classList.add('seasonal-filter-trigger');
  }
  // Add special class for custom date filter trigger
  if (value === 'Custom Date' && category === 'time-period') {
    bubble.classList.add('custom-date-filter-trigger');
  }
  bubble.dataset.value = value;
  bubble.textContent = value;
  bubble.addEventListener('click', function() {
    const cat = this.closest('.filter-options-list').dataset.category;
    const val = this.dataset.value;
    
    // Special handling for Seasonal filter - open modal instead of adding directly
    if (val === 'Seasonal' && cat === 'time-period') {
      openSeasonalModal();
      return;
    }

    // Special handling for Custom Date filter - open modal instead of adding directly
    if (val === 'Custom Date' && cat === 'time-period') {
      openCustomDateModal();
      return;
    }
    
    // Special handling for type filters - only one can be active at a time
    if (cat === 'type') {
      // Remove any existing active type filter
      const activeTypeFilters = document.querySelectorAll('.active-filter-bubble[data-category="type"]');
      activeTypeFilters.forEach(activeBubble => {
        const activeValue = activeBubble.dataset.value;
        activeBubble.remove();
        filterState.active.get('type')?.delete(activeValue);
        if (!filterState.available.has('type')) {
          filterState.available.set('type', new Set());
        }
        filterState.available.get('type').add(activeValue);
        restoreAvailableFilter('type', activeValue);
      });
    }

    // Special handling for time-period filters - only one can be active at a time
    if (cat === 'time-period') {
      // Remove any existing active time-period filter
      const activeTimePeriodFilters = document.querySelectorAll('.active-filter-bubble[data-category="time-period"]');
      activeTimePeriodFilters.forEach(activeBubble => {
        const activeValue = activeBubble.dataset.value;
        const isSeasonal = activeBubble.dataset.isSeasonal === 'true';
        const isCustomDate = activeBubble.dataset.isCustomDate === 'true';
        
        activeBubble.remove();
        filterState.active.get('time-period')?.delete(activeValue);
        if (!filterState.available.has('time-period')) {
          filterState.available.set('time-period', new Set());
        }
        
        // Preserve state for seasonal and custom date filters
        if (isSeasonal && activeBubble.dataset.seasons) {
          const seasonsArray = activeBubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
          selectedSeasons = new Set(seasonsArray);
          filterState.available.get('time-period').add('Seasonal');
          restoreAvailableFilter('time-period', 'Seasonal');
        } else if (isCustomDate && activeBubble.dataset.startDate && activeBubble.dataset.endDate) {
          const startDate = parseDateISO(activeBubble.dataset.startDate);
          const endDate = parseDateISO(activeBubble.dataset.endDate);
          customStartDate = startDate;
          customEndDate = endDate;
          filterState.available.get('time-period').add('Custom Date');
          restoreAvailableFilter('time-period', 'Custom Date');
        } else {
          filterState.available.get('time-period').add(activeValue);
          restoreAvailableFilter('time-period', activeValue);
        }
      });
    }
    
    this.remove();
    if (!filterState.active.has(cat)) {
      filterState.active.set(cat, new Set());
    }
    filterState.active.get(cat).add(val);
    filterState.available.get(cat)?.delete(val);
    addActiveFilter(cat, val);
  });

  // Find the correct insertion position based on filter order
  const order = filterOrders[category] || [];
  const valueIndex = order.indexOf(value);
  const existingBubbles = Array.from(categoryList.children);
  
  let insertIndex = existingBubbles.length;
  
  for (let i = 0; i < existingBubbles.length; i++) {
    const existingValue = existingBubbles[i].dataset.value;
    const existingValueIndex = order.indexOf(existingValue);
    
    if (valueIndex < existingValueIndex) {
      insertIndex = i;
      break;
    }
  }
  
  // Insert at the correct position
  if (insertIndex < existingBubbles.length) {
    categoryList.insertBefore(bubble, existingBubbles[insertIndex]);
  } else {
    categoryList.appendChild(bubble);
  }

  // Re-setup hover handlers for type filters if this is a type filter
  if (category === 'type') {
    setupTypeFilterHovers();
  }
  
  // Re-setup hover handlers for time-period filters if this is a time-period filter
  if (category === 'time-period') {
    setupTimePeriodFilterHovers();
  }
}

// Sort available filters on page load
function sortAvailableFilters() {
  document.querySelectorAll('.filter-options-list').forEach(list => {
    const category = list.dataset.category;
    const order = filterOrders[category] || [];
    const bubbles = Array.from(list.children);
    
    // Sort bubbles based on order
    bubbles.sort((a, b) => {
      const aIndex = order.indexOf(a.dataset.value);
      const bIndex = order.indexOf(b.dataset.value);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    // Re-append in sorted order
    bubbles.forEach(bubble => list.appendChild(bubble));
  });
}

// Sort active filters on page load
function sortActiveFilters() {
  const activeFiltersList = document.getElementById('activeFiltersList');
  const bubbles = Array.from(activeFiltersList.children);
  
  // Sort by category order first, then by filter order within category
  bubbles.sort((a, b) => {
    const aCategory = a.dataset.category;
    const bCategory = b.dataset.category;
    const aCategoryIndex = activeFilterCategoryOrder.indexOf(aCategory);
    const bCategoryIndex = activeFilterCategoryOrder.indexOf(bCategory);
    
    if (aCategoryIndex !== bCategoryIndex) {
      return aCategoryIndex - bCategoryIndex;
    }
    
    // Same category - sort by filter order
    const order = filterOrders[aCategory] || [];
    const aValueIndex = order.indexOf(a.dataset.value);
    const bValueIndex = order.indexOf(b.dataset.value);
    if (aValueIndex === -1 && bValueIndex === -1) return 0;
    if (aValueIndex === -1) return 1;
    if (bValueIndex === -1) return -1;
    return aValueIndex - bValueIndex;
  });
  
  // Re-append in sorted order
  bubbles.forEach(bubble => activeFiltersList.appendChild(bubble));
}

// Seasonal Modal Functions
function openSeasonalModal() {
  const backdrop = document.getElementById('seasonalModalBackdrop');
  const container = document.getElementById('seasonalModalContainer');
  backdrop.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent body scroll
  
  // Generate season bubbles if not already generated
  generateSeasonBubbles();
  
  // Restore previously selected seasons
  updateSeasonBubblesDisplay();
}

function closeSeasonalModal() {
  const backdrop = document.getElementById('seasonalModalBackdrop');
  backdrop.style.display = 'none';
  document.body.style.overflow = ''; // Restore body scroll
}

function generateSeasonBubbles() {
  const grid = document.getElementById('seasonBubblesGrid');
  if (grid.children.length > 0) return; // Already generated
  
  for (let i = 1; i <= TOTAL_SEASONS; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'season-bubble';
    bubble.dataset.season = i;
    bubble.textContent = `Season ${i}`;
    bubble.addEventListener('click', () => toggleSeasonSelection(i));
    grid.appendChild(bubble);
  }
}

function toggleSeasonSelection(seasonNum) {
  if (selectedSeasons.has(seasonNum)) {
    selectedSeasons.delete(seasonNum);
  } else {
    selectedSeasons.add(seasonNum);
  }
  updateSeasonBubblesDisplay();
}

function updateSeasonBubblesDisplay() {
  const bubbles = document.querySelectorAll('.season-bubble');
  bubbles.forEach(bubble => {
    const seasonNum = parseInt(bubble.dataset.season);
    if (selectedSeasons.has(seasonNum)) {
      bubble.classList.add('selected');
    } else {
      bubble.classList.remove('selected');
    }
  });
}

function formatSelectedSeasons() {
  if (selectedSeasons.size === 0) return 'Seasonal';
  
  const sorted = Array.from(selectedSeasons).sort((a, b) => a - b);
  const abbreviated = sorted.map(s => `S${s}`).join(', ');
  return `Seasonal: ${abbreviated}`;
}

function applySeasonalFilter() {
  if (selectedSeasons.size === 0) {
    closeSeasonalModal();
    return;
  }

  // Save the current selection (the one the user just made in the modal)
  const currentSelectedSeasons = new Set(selectedSeasons);

  // Remove any existing active time-period filter
  const activeTimePeriodFilters = document.querySelectorAll('.active-filter-bubble[data-category="time-period"]');
  activeTimePeriodFilters.forEach(activeBubble => {
    const activeValue = activeBubble.dataset.value;
    const isSeasonal = activeBubble.dataset.isSeasonal === 'true';
    const isCustomDate = activeBubble.dataset.isCustomDate === 'true';
    
    activeBubble.remove();
    filterState.active.get('time-period')?.delete(activeValue);
    if (!filterState.available.has('time-period')) {
      filterState.available.set('time-period', new Set());
    }
    
    // Restore to available filters (preserve state for seasonal and custom date)
    if (isSeasonal && activeBubble.dataset.seasons) {
      // Preserve the old state in selectedSeasons so it shows when clicked again
      const seasonsArray = activeBubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
      selectedSeasons = new Set(seasonsArray);
      filterState.available.get('time-period').add('Seasonal');
      restoreAvailableFilter('time-period', 'Seasonal');
    } else if (isCustomDate && activeBubble.dataset.startDate && activeBubble.dataset.endDate) {
      const startDate = parseDateISO(activeBubble.dataset.startDate);
      const endDate = parseDateISO(activeBubble.dataset.endDate);
      customStartDate = startDate;
      customEndDate = endDate;
      filterState.available.get('time-period').add('Custom Date');
      restoreAvailableFilter('time-period', 'Custom Date');
    } else {
      filterState.available.get('time-period').add(activeValue);
      restoreAvailableFilter('time-period', activeValue);
    }
  });

  // Restore the current selection for the new filter
  selectedSeasons = currentSelectedSeasons;

  const formattedValue = formatSelectedSeasons();
  const seasonalBubble = document.querySelector('.seasonal-filter-trigger');
  
  // Remove from available filters
  seasonalBubble.remove();
  
  // Update state
  if (!filterState.active.has('time-period')) {
    filterState.active.set('time-period', new Set());
  }
  filterState.active.get('time-period').add(formattedValue);
  filterState.available.get('time-period')?.delete('Seasonal');
  
  // Create bubble with special data attributes for seasonal filter
  const activeFiltersList = document.getElementById('activeFiltersList');
  const bubble = document.createElement('div');
  bubble.className = 'active-filter-bubble';
  bubble.dataset.category = 'time-period';
  bubble.dataset.value = formattedValue;
  bubble.dataset.isSeasonal = 'true';
  bubble.dataset.seasons = Array.from(selectedSeasons).sort((a, b) => a - b).join(',');
  bubble.innerHTML = `
    <span class="filter-text">${formattedValue}</span>
    <span class="filter-remove">×</span>
  `;
  
  // Insert in correct position using existing addActiveFilter logic
  const categoryIndex = activeFilterCategoryOrder.indexOf('time-period');
  const existingBubbles = Array.from(activeFiltersList.children);
  let insertIndex = existingBubbles.length;
  
  for (let i = 0; i < existingBubbles.length; i++) {
    const existingCategory = existingBubbles[i].dataset.category;
    const existingCategoryIndex = activeFilterCategoryOrder.indexOf(existingCategory);
    
    if (categoryIndex < existingCategoryIndex) {
      insertIndex = i;
      break;
    } else if (categoryIndex === existingCategoryIndex) {
      const order = filterOrders['time-period'] || [];
      const valueIndex = order.indexOf(formattedValue);
      const existingValue = existingBubbles[i].dataset.value;
      const existingValueIndex = order.indexOf(existingValue);
      
      if (valueIndex < existingValueIndex) {
        insertIndex = i;
        break;
      }
    }
  }
  
  if (insertIndex < existingBubbles.length) {
    activeFiltersList.insertBefore(bubble, existingBubbles[insertIndex]);
  } else {
    activeFiltersList.appendChild(bubble);
  }
  
  // Update data-range text
  updateDataRange();
  
  // Update leaderboard title
  updateLeaderboardTitle();
  
  closeSeasonalModal();
}

function clearSeasonalSelection() {
  selectedSeasons.clear();
  updateSeasonBubblesDisplay();
}

// Modal event handlers
document.getElementById('seasonalModalApply').addEventListener('click', applySeasonalFilter);
document.getElementById('seasonalModalCancel').addEventListener('click', closeSeasonalModal);
document.getElementById('seasonalModalClear').addEventListener('click', clearSeasonalSelection);

// Close modal on backdrop click
document.getElementById('seasonalModalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'seasonalModalBackdrop') {
    closeSeasonalModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const seasonalBackdrop = document.getElementById('seasonalModalBackdrop');
    const customDateBackdrop = document.getElementById('customDateModalBackdrop');
    if (seasonalBackdrop.style.display !== 'none') {
      closeSeasonalModal();
    } else if (customDateBackdrop.style.display !== 'none') {
      closeCustomDateModal();
    }
  }
});

// Custom Date Filter State
let customStartDate = { day: null, month: null, year: null };
let customEndDate = { day: null, month: null, year: null };

// Date Utility Functions
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function formatDateISO(day, month, year) {
  if (!day || !month || !year) return null;
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

function parseDateISO(dateStr) {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    day: parseInt(parts[2])
  };
}

function validateDateRange() {
  if (!customStartDate.day || !customStartDate.month || !customStartDate.year ||
      !customEndDate.day || !customEndDate.month || !customEndDate.year) {
    return { valid: false, message: 'Please select both start and end dates' };
  }

  const start = new Date(customStartDate.year, customStartDate.month - 1, customStartDate.day);
  const end = new Date(customEndDate.year, customEndDate.month - 1, customEndDate.day);

  if (end < start) {
    return { valid: false, message: 'End date must be after start date' };
  }

  return { valid: true, message: '' };
}

function populateYearDropdown(selectId, selectedYear = null) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Year</option>';
  for (let year = 2014; year <= 2025; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (selectedYear === year) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

function populateDayDropdown(selectId, month, year, selectedDay = null) {
  const select = document.getElementById(selectId);
  const currentValue = select.value;
  select.innerHTML = '<option value="">Day</option>';
  
  // Determine max days - if month/year not selected, use 31, otherwise use actual days in month
  let maxDays = 31;
  if (month && year) {
    maxDays = getDaysInMonth(month, year);
  }

  // If selected day is invalid for the month, adjust it to max valid day
  let dayToSelect = selectedDay;
  if (selectedDay && month && year && selectedDay > maxDays) {
    dayToSelect = maxDays;
    // Update the state if this is start or end date
    if (selectId === 'startDay') {
      customStartDate.day = maxDays;
    } else if (selectId === 'endDay') {
      customEndDate.day = maxDays;
    }
  }

  for (let day = 1; day <= maxDays; day++) {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    if (dayToSelect === day || (!dayToSelect && currentValue == day)) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

function updateDayDropdowns() {
  // Update start day dropdown
  const startMonth = parseInt(document.getElementById('startMonth').value) || null;
  const startYear = parseInt(document.getElementById('startYear').value) || null;
  const currentStartDay = customStartDate.day || parseInt(document.getElementById('startDay').value) || null;
  populateDayDropdown('startDay', startMonth, startYear, currentStartDay);
  
  // Update the state if day was adjusted
  const startDayValue = document.getElementById('startDay').value;
  if (startDayValue) {
    customStartDate.day = parseInt(startDayValue);
  }

  // Update end day dropdown
  const endMonth = parseInt(document.getElementById('endMonth').value) || null;
  const endYear = parseInt(document.getElementById('endYear').value) || null;
  const currentEndDay = customEndDate.day || parseInt(document.getElementById('endDay').value) || null;
  populateDayDropdown('endDay', endMonth, endYear, currentEndDay);
  
  // Update the state if day was adjusted
  const endDayValue = document.getElementById('endDay').value;
  if (endDayValue) {
    customEndDate.day = parseInt(endDayValue);
  }
}

function updateValidation() {
  const validation = validateDateRange();
  const messageEl = document.getElementById('dateValidationMessage');
  const applyBtn = document.getElementById('customDateModalApply');

  if (!validation.valid && validation.message) {
    messageEl.textContent = validation.message;
    messageEl.style.display = 'block';
    messageEl.className = 'validation-message validation-error';
    applyBtn.disabled = true;
  } else {
    messageEl.style.display = 'none';
    applyBtn.disabled = false;
  }
}

// Custom Date Modal Functions
function openCustomDateModal() {
  const backdrop = document.getElementById('customDateModalBackdrop');
  backdrop.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Populate year dropdowns
  populateYearDropdown('startYear', customStartDate.year);
  populateYearDropdown('endYear', customEndDate.year);

  // Set month values if they exist
  if (customStartDate.month) {
    document.getElementById('startMonth').value = customStartDate.month;
  } else {
    document.getElementById('startMonth').value = '';
  }
  if (customEndDate.month) {
    document.getElementById('endMonth').value = customEndDate.month;
  } else {
    document.getElementById('endMonth').value = '';
  }

  // Populate day dropdowns (always populate with 31 days initially, will trim when month/year selected)
  // Get current selected day or use stored value
  const startDayToUse = customStartDate.day || (document.getElementById('startDay')?.value ? parseInt(document.getElementById('startDay').value) : null);
  const endDayToUse = customEndDate.day || (document.getElementById('endDay')?.value ? parseInt(document.getElementById('endDay').value) : null);
  
  populateDayDropdown('startDay', customStartDate.month, customStartDate.year, startDayToUse);
  populateDayDropdown('endDay', customEndDate.month, customEndDate.year, endDayToUse);
  
  // Set the selected day if it exists
  if (startDayToUse) {
    document.getElementById('startDay').value = startDayToUse;
  }
  if (endDayToUse) {
    document.getElementById('endDay').value = endDayToUse;
  }

  // Update validation
  updateValidation();
}

function closeCustomDateModal() {
  const backdrop = document.getElementById('customDateModalBackdrop');
  backdrop.style.display = 'none';
  document.body.style.overflow = '';
}

function formatCustomDateFilter() {
  const startISO = formatDateISO(customStartDate.day, customStartDate.month, customStartDate.year);
  const endISO = formatDateISO(customEndDate.day, customEndDate.month, customEndDate.year);
  if (!startISO || !endISO) return 'Custom Date';
  return `Custom Date: ${startISO} - ${endISO}`;
}

function applyCustomDateFilter() {
  const validation = validateDateRange();
  if (!validation.valid) {
    return;
  }

  // Remove any existing active time-period filter
  const activeTimePeriodFilters = document.querySelectorAll('.active-filter-bubble[data-category="time-period"]');
  activeTimePeriodFilters.forEach(activeBubble => {
    const activeValue = activeBubble.dataset.value;
    const isSeasonal = activeBubble.dataset.isSeasonal === 'true';
    const isCustomDate = activeBubble.dataset.isCustomDate === 'true';
    
    activeBubble.remove();
    filterState.active.get('time-period')?.delete(activeValue);
    if (!filterState.available.has('time-period')) {
      filterState.available.set('time-period', new Set());
    }
    
    // Preserve state for seasonal and custom date filters
    if (isSeasonal && activeBubble.dataset.seasons) {
      const seasonsArray = activeBubble.dataset.seasons.split(',').map(s => parseInt(s.trim()));
      selectedSeasons = new Set(seasonsArray);
      filterState.available.get('time-period').add('Seasonal');
      restoreAvailableFilter('time-period', 'Seasonal');
    } else if (isCustomDate && activeBubble.dataset.startDate && activeBubble.dataset.endDate) {
      const startDate = parseDateISO(activeBubble.dataset.startDate);
      const endDate = parseDateISO(activeBubble.dataset.endDate);
      customStartDate = startDate;
      customEndDate = endDate;
      filterState.available.get('time-period').add('Custom Date');
      restoreAvailableFilter('time-period', 'Custom Date');
    } else {
      filterState.available.get('time-period').add(activeValue);
      restoreAvailableFilter('time-period', activeValue);
    }
  });

  const formattedValue = formatCustomDateFilter();
  const customDateBubble = document.querySelector('.custom-date-filter-trigger');
  
  // Remove from available filters
  customDateBubble.remove();
  
  // Update state
  if (!filterState.active.has('time-period')) {
    filterState.active.set('time-period', new Set());
  }
  filterState.active.get('time-period').add(formattedValue);
  filterState.available.get('time-period')?.delete('Custom Date');
  
  // Create bubble with special data attributes for custom date filter
  const activeFiltersList = document.getElementById('activeFiltersList');
  const bubble = document.createElement('div');
  bubble.className = 'active-filter-bubble';
  bubble.dataset.category = 'time-period';
  bubble.dataset.value = formattedValue;
  bubble.dataset.isCustomDate = 'true';
  bubble.dataset.startDate = formatDateISO(customStartDate.day, customStartDate.month, customStartDate.year);
  bubble.dataset.endDate = formatDateISO(customEndDate.day, customEndDate.month, customEndDate.year);
  bubble.innerHTML = `
    <span class="filter-text">${formattedValue}</span>
    <span class="filter-remove">×</span>
  `;
  
  // Insert in correct position
  const categoryIndex = activeFilterCategoryOrder.indexOf('time-period');
  const existingBubbles = Array.from(activeFiltersList.children);
  let insertIndex = existingBubbles.length;
  
  for (let i = 0; i < existingBubbles.length; i++) {
    const existingCategory = existingBubbles[i].dataset.category;
    const existingCategoryIndex = activeFilterCategoryOrder.indexOf(existingCategory);
    
    if (categoryIndex < existingCategoryIndex) {
      insertIndex = i;
      break;
    } else if (categoryIndex === existingCategoryIndex) {
      const order = filterOrders['time-period'] || [];
      const valueIndex = order.indexOf(formattedValue);
      const existingValue = existingBubbles[i].dataset.value;
      const existingValueIndex = order.indexOf(existingValue);
      
      if (valueIndex < existingValueIndex) {
        insertIndex = i;
        break;
      }
    }
  }
  
  if (insertIndex < existingBubbles.length) {
    activeFiltersList.insertBefore(bubble, existingBubbles[insertIndex]);
  } else {
    activeFiltersList.appendChild(bubble);
  }
  
  // Update data-range text
  updateDataRange();
  
  // Update leaderboard title
  updateLeaderboardTitle();
  
  closeCustomDateModal();
}

function clearCustomDateSelection() {
  customStartDate = { day: null, month: null, year: null };
  customEndDate = { day: null, month: null, year: null };
  document.getElementById('startDay').value = '';
  document.getElementById('startMonth').value = '';
  document.getElementById('startYear').value = '';
  document.getElementById('endDay').value = '';
  document.getElementById('endMonth').value = '';
  document.getElementById('endYear').value = '';
  updateDayDropdowns();
  updateValidation();
}

// Custom Date Modal Event Handlers
document.getElementById('customDateModalApply').addEventListener('click', applyCustomDateFilter);
document.getElementById('customDateModalCancel').addEventListener('click', closeCustomDateModal);
document.getElementById('customDateModalClear').addEventListener('click', clearCustomDateSelection);

// Close modal on backdrop click
document.getElementById('customDateModalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'customDateModalBackdrop') {
    closeCustomDateModal();
  }
});

// Date dropdown change handlers
document.getElementById('startMonth').addEventListener('change', (e) => {
  customStartDate.month = e.target.value ? parseInt(e.target.value) : null;
  updateDayDropdowns();
  updateValidation();
});

document.getElementById('startYear').addEventListener('change', (e) => {
  customStartDate.year = e.target.value ? parseInt(e.target.value) : null;
  updateDayDropdowns();
  updateValidation();
});

document.getElementById('startDay').addEventListener('change', (e) => {
  customStartDate.day = e.target.value ? parseInt(e.target.value) : null;
  updateValidation();
});

document.getElementById('endMonth').addEventListener('change', (e) => {
  customEndDate.month = e.target.value ? parseInt(e.target.value) : null;
  updateDayDropdowns();
  updateValidation();
});

document.getElementById('endYear').addEventListener('change', (e) => {
  customEndDate.year = e.target.value ? parseInt(e.target.value) : null;
  updateDayDropdowns();
  updateValidation();
});

document.getElementById('endDay').addEventListener('change', (e) => {
  customEndDate.day = e.target.value ? parseInt(e.target.value) : null;
  updateValidation();
});

// Leaderboard data and rendering functions

// Pagination state
let currentLeaderboardData = [];
let currentPage = 1;
let currentRowsPerPage = 10;

// Leaderboard view mode (player or clan)
let isClanMode = false;

// Generate fabricated leaderboard data based on type
function generateLeaderboardData(type, count = 100) {
  const data = [];
  
  for (let i = 1; i <= count; i++) {
    let statValue;
    const entityName = isClanMode ? `Clan${i}` : `Player${i}`;
    
    switch (type) {
      case 'Full Clears':
      case 'Clears':
        statValue = (150 - (i - 1) * 2).toString();
        break;
      case 'Fastest Time':
      case 'Average Time':
        // Generate time strings like "1:23:45"
        const hours = Math.floor((i - 1) / 10);
        const minutes = 20 + (i - 1) % 10;
        const seconds = 30 + (i * 3) % 30;
        statValue = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        break;
      case 'Sherpas':
        statValue = (200 - (i - 1) * 3).toString();
        break;
      case 'World\'s First':
        statValue = i <= 3 ? 'Yes' : 'No';
        break;
      case 'Total Time':
        const totalHours = 100 + (i - 1) * 5;
        statValue = `${totalHours}:00:00`;
        break;
      case 'Kills':
        statValue = (5000 - (i - 1) * 50).toString();
        break;
      case 'Deaths':
        statValue = (100 - (i - 1)).toString();
        break;
      case 'Assists':
        statValue = (3000 - (i - 1) * 30).toString();
        break;
      default:
        statValue = (150 - (i - 1) * 2).toString();
    }
    
    data.push({
      rank: i,
      player: entityName,
      statValue: statValue
    });
  }
  
  return data;
}

// Update the header stat column name based on type filter
function updateLeaderboardHeader(type) {
  const statHeader = document.getElementById('statHeader');
  if (!statHeader) return;
  
  const headerMap = {
    'Full Clears': 'Clears',
    'Clears': 'Clears',
    'Fastest Time': 'Time',
    'Average Time': 'Time',
    'Sherpas': 'Sherpas',
    'World\'s First': 'WF',
    'Total Time': 'Time',
    'Kills': 'Kills',
    'Deaths': 'Deaths',
    'Assists': 'Assists'
  };
  
  statHeader.textContent = headerMap[type] || 'Clears';
}

// Render leaderboard rows
function renderLeaderboard(data, rowsPerPage, page = 1) {
  const leaderboard = document.querySelector('.leaderboard');
  if (!leaderboard) return;
  
  // Update state
  currentLeaderboardData = data;
  currentPage = page;
  currentRowsPerPage = rowsPerPage;
  
  // Remove all rows except the header
  const headerRow = leaderboard.querySelector('.header-row');
  const existingRows = leaderboard.querySelectorAll('.leaderboard-row:not(.header-row)');
  existingRows.forEach(row => row.remove());
  
  // Calculate pagination
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = data.slice(startIndex, endIndex);
  
  // Create rows for current page
  let lastRow = headerRow;
  pageData.forEach(item => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    
    row.innerHTML = `
      <div class="rank-player">
        <span class="rank">${item.rank}</span>
        <span class="player">${item.player}</span>
      </div>
      <div class="stat-value">${item.statValue}</div>
    `;
    
    // Insert after the last inserted row
    lastRow.insertAdjacentElement('afterend', row);
    lastRow = row;
  });
  
  // Update page range display
  const pageRange = document.querySelector('.page-range');
  if (pageRange) {
    const start = startIndex + 1;
    const end = Math.min(endIndex, totalRows);
    pageRange.textContent = `${start}-${end}`;
  }
  
  // Update navigation buttons
  updatePaginationButtons(page, totalPages);
}

// Update UI based on view mode (player/clan)
function updateViewMode() {
  const searchInput = document.getElementById('leaderboardSearchInput');
  const navbarSearchInput = document.getElementById('navbarSearchInput');
  const entityHeader = document.getElementById('entityHeader');
  
  if (isClanMode) {
    if (searchInput) {
      searchInput.placeholder = 'Search for a clan...';
    }
    if (navbarSearchInput) {
      navbarSearchInput.placeholder = 'Search for a clan...';
    }
    if (entityHeader) {
      entityHeader.textContent = 'Clan';
    }
  } else {
    if (searchInput) {
      searchInput.placeholder = 'Search for a player...';
    }
    if (navbarSearchInput) {
      navbarSearchInput.placeholder = 'Search for a player...';
    }
    if (entityHeader) {
      entityHeader.textContent = 'Player';
    }
  }
  
  // Reload leaderboard with new mode
  loadLeaderboard(true);
}

// Setup toggle event listener
function setupLeaderboardToggle() {
  const toggleCheckbox = document.getElementById('leaderboard-view-toggle');
  if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', () => {
      isClanMode = toggleCheckbox.checked;
      updateViewMode();
    });
  }
}

// Update pagination button states
function updatePaginationButtons(currentPage, totalPages) {
  const navButtons = document.querySelectorAll('.nav-button');
  if (navButtons.length >= 2) {
    const prevButton = navButtons[0];
    const nextButton = navButtons[1];
    
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
  }
}

// Load leaderboard based on active filters
function loadLeaderboard(resetPage = true) {
  // Get active type filter or default to "Full Clears"
  let activeType = 'Full Clears';
  const activeTypeFilters = filterState.active.get('type');
  if (activeTypeFilters && activeTypeFilters.size > 0) {
    // Get the first (and only) type filter value
    const typeValue = Array.from(activeTypeFilters)[0];
    // Check if it matches any of the known types
    const knownTypes = ['Full Clears', 'Clears', 'Fastest Time', 'Average Time', 'Sherpas', 'World\'s First', 'Total Time', 'Kills', 'Deaths', 'Assists'];
    if (knownTypes.includes(typeValue)) {
      activeType = typeValue;
    }
  }
  
  // Get rows per page setting
  const rowsInput = document.querySelector('.rows-input');
  let rowsPerPage = 10;
  if (rowsInput) {
    const value = parseInt(rowsInput.value);
    if (value && value > 0) {
      rowsPerPage = value;
    }
  }
  
  // Generate data based on type
  const data = generateLeaderboardData(activeType, 100);
  
  // Update header
  updateLeaderboardHeader(activeType);
  
  // Render leaderboard (reset to page 1 if filters changed, otherwise keep current page)
  const pageToRender = resetPage ? 1 : currentPage;
  renderLeaderboard(data, rowsPerPage, pageToRender);
}

// Add blur handler for rows input
const rowsInput = document.querySelector('.rows-input');
if (rowsInput) {
  rowsInput.addEventListener('blur', (e) => {
    const value = parseInt(e.target.value);
    if (value && value > 0) {
      // Update the leaderboard with new rows per page (reset to page 1)
      loadLeaderboard(true);
    } else {
      // Reset to default if invalid
      e.target.value = 10;
      loadLeaderboard(true);
    }
  });
}

// Add pagination button handlers
const navButtons = document.querySelectorAll('.nav-button');
if (navButtons.length >= 2) {
  const prevButton = navButtons[0];
  const nextButton = navButtons[1];
  
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      renderLeaderboard(currentLeaderboardData, currentRowsPerPage, currentPage - 1);
    }
  });
  
  nextButton.addEventListener('click', () => {
    const totalPages = Math.ceil(currentLeaderboardData.length / currentRowsPerPage);
    if (currentPage < totalPages) {
      renderLeaderboard(currentLeaderboardData, currentRowsPerPage, currentPage + 1);
    }
  });
}

// URL Parameter Parsing Functions

// Parse URL query parameters
function parseURLParameters() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    // Decode URL-encoded values
    result[key] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  
  return result;
}

// Apply filters from URL parameters
function applyFiltersFromURL() {
  const urlParams = parseURLParameters();
  
  // Map of URL parameter names to filter categories
  const paramToCategory = {
    'raids': 'raids',
    'dungeons': 'dungeons',
    'mode': 'mode',
    'type': 'type',
    'fireteam-size': 'fireteam-size',
    'time-period': 'time-period',
    'platform': 'platform'
  };
  
  // Process each URL parameter
  for (const [param, value] of Object.entries(urlParams)) {
    const category = paramToCategory[param];
    if (!category) continue;
    
    // Find and remove the corresponding available filter bubble from DOM
    // Search all bubbles in the category (even if filter grid is hidden)
    const allBubblesInCategory = Array.from(document.querySelectorAll(`.available-filter-bubble[data-category="${category}"]`));
    const availableBubble = allBubblesInCategory.find(bubble => bubble.dataset.value === value);
    
    // Remove from DOM if found
    if (availableBubble) {
      availableBubble.remove();
    }
    
    // Always remove from available state, even if DOM bubble wasn't found
    if (!filterState.available.has(category)) {
      filterState.available.set(category, new Set());
    }
    filterState.available.get(category).delete(value);
    
    // Also remove from DOM by searching more broadly if not found in category-specific search
    // This handles cases where bubbles exist but weren't found in the initial search
    if (!availableBubble) {
      const allBubbles = Array.from(document.querySelectorAll('.available-filter-bubble'));
      const matchingBubble = allBubbles.find(bubble => 
        bubble.dataset.category === category && bubble.dataset.value === value
      );
      if (matchingBubble) {
        matchingBubble.remove();
      }
    }
    
    // Always add to active state and DOM, regardless of whether bubble was found
    if (!filterState.active.has(category)) {
      filterState.active.set(category, new Set());
    }
    filterState.active.get(category).add(value);
    
    // Add to active filters in DOM
    addActiveFilter(category, value);
  }
  
  // Re-sort filters after applying URL parameters
  sortAvailableFilters();
  sortActiveFilters();
  setupTypeFilterHovers();
  setupTimePeriodFilterHovers();
  
  // Update leaderboard title
  updateLeaderboardTitle();
}

// Initialize on page load
// First, initialize available filters from DOM (before URL params are applied)
initializeAvailableFilters();
initializeActiveFilters();

// Apply filters from URL parameters (if any) - this will remove them from available
applyFiltersFromURL();

// Re-initialize available filters to exclude any that are now active
// This ensures DOM bubbles that weren't found are still excluded from available state
initializeAvailableFilters();

sortAvailableFilters();
sortActiveFilters();
setupTypeFilterHovers();
setupTimePeriodFilterHovers();

// Update data-range and fireteam-size displays after URL parameters are applied
updateDataRange();
updateFireteamSize();

// Update leaderboard title after all initialization is complete
updateLeaderboardTitle();

// Setup leaderboard toggle
setupLeaderboardToggle();

// Load initial leaderboard data
loadLeaderboard();

