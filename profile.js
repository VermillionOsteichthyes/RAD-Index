// Player data storage
let playerData = null;
let clearsData = null;
let dotsLoaded = new Set(); // Track which activities have loaded dots

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadPlayerData();
  setupToggle();
});

// Load player summary data (Phase 1: Fast Load)
async function loadPlayerData() {
  try {
    // Get player ID from URL parameter or use default
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('playerid') || '123456789';
    
    // Load summary data
    const response = await fetch('player-data.json');
    playerData = await response.json();
    
    // Update player header
    updatePlayerHeader();
    
    // Generate activity cards
    generateActivityCards();
  } catch (error) {
    console.error('Error loading player data:', error);
  }
}

// Get rank color class based on rank value
function getRankColorClass(rank) {
  if (rank <= 10) return 'rank-t10';
  if (rank <= 50) return 'rank-t50';
  if (rank <= 100) return 'rank-t100';
  if (rank <= 200) return 'rank-t200';
  if (rank <= 500) return 'rank-t500';
  if (rank <= 1000) return 'rank-t1k';
  if (rank <= 5000) return 'rank-t5k';
  return 'rank-default';
}

// Update player header with data
function updatePlayerHeader() {
  if (!playerData) return;
  
  document.getElementById('playerName').textContent = playerData.name;
  document.getElementById('clanName').textContent = playerData.clan;
  document.getElementById('playerEmblem').src = playerData.emblemUrl;
  
  // Update ranks based on current toggle state (default to raids)
  updateRankBubbles(false);
}

// Update rank bubbles based on toggle state (false = raids, true = dungeons)
function updateRankBubbles(isDungeons) {
  if (!playerData) return;
  
  const clearsRankBubble = document.getElementById('clearsRankBubble');
  const speedRankBubble = document.getElementById('speedRankBubble');
  const clearsRankLabel = document.getElementById('clearsRankLabel');
  const speedRankLabel = document.getElementById('speedRankLabel');
  const clearsRankTime = document.getElementById('clearsRankTime');
  const speedRankTime = document.getElementById('speedRankTime');
  
  if (isDungeons) {
    // Show dungeons ranks
    const clearsRank = playerData.dungeonsClearsRank || 0;
    const speedRank = playerData.dungeonsSpeedRank || 0;
    const speedTime = playerData.dungeonsSpeedTime || 'N/A';
    const fullClearsCount = playerData.dungeonsFullClearsCount || 0;
    
    clearsRankLabel.textContent = `Clears Rank #${clearsRank}`;
    speedRankLabel.textContent = `Speed Rank #${speedRank}`;
    clearsRankTime.textContent = `${fullClearsCount.toLocaleString()}`;
    speedRankTime.textContent = speedTime;
    
    clearsRankBubble.className = `rank-bubble ${getRankColorClass(clearsRank)}`;
    speedRankBubble.className = `rank-bubble ${getRankColorClass(speedRank)}`;
  } else {
    // Show raids ranks
    const clearsRank = playerData.raidsClearsRank || 0;
    const speedRank = playerData.raidsSpeedRank || 0;
    const speedTime = playerData.raidsSpeedTime || 'N/A';
    const fullClearsCount = playerData.raidsFullClearsCount || 0;
    
    clearsRankLabel.textContent = `Clears Rank #${clearsRank}`;
    speedRankLabel.textContent = `Speed Rank #${speedRank}`;
    clearsRankTime.textContent = `${fullClearsCount.toLocaleString()}`;
    speedRankTime.textContent = speedTime;
    
    clearsRankBubble.className = `rank-bubble ${getRankColorClass(clearsRank)}`;
    speedRankBubble.className = `rank-bubble ${getRankColorClass(speedRank)}`;
  }
}

// Setup Raids/Dungeons toggle
function setupToggle() {
  const toggleCheckbox = document.getElementById('view-toggle');
  const raidCards = document.querySelectorAll('.raid-card');
  const dungeonCards = document.querySelectorAll('.dungeon-card');
  
  function updateCardVisibility() {
    const isDungeons = toggleCheckbox.checked;
    
    if (isDungeons) {
      // Show dungeons, hide raids
      raidCards.forEach(card => {
        card.style.display = 'none';
      });
      dungeonCards.forEach(card => {
        card.style.display = 'block';
      });
    } else {
      // Show raids, hide dungeons
      raidCards.forEach(card => {
        card.style.display = 'block';
      });
      dungeonCards.forEach(card => {
        card.style.display = 'none';
      });
    }
    
    // Update rank bubbles based on toggle state
    updateRankBubbles(isDungeons);
  }
  
  toggleCheckbox.addEventListener('change', updateCardVisibility);
  updateCardVisibility(); // Initialize
}

// Generate activity cards dynamically
function generateActivityCards() {
  if (!playerData || !playerData.activities) return;
  
  const cardGrid = document.getElementById('cardGrid');
  cardGrid.innerHTML = '';
  
  // Generate raid cards
  playerData.activities.raids.forEach(activity => {
    const card = createActivityCard(activity, 'raid');
    cardGrid.appendChild(card);
  });
  
  // Generate dungeon cards
  playerData.activities.dungeons.forEach(activity => {
    const card = createActivityCard(activity, 'dungeon');
    cardGrid.appendChild(card);
  });
  
  // Re-setup toggle after cards are generated
  setTimeout(() => {
    setupToggle();
    setupCollapsibleSections();
    setupDotsLazyLoading();
  }, 0);
}

// Create a single activity card
function createActivityCard(activity, type) {
  const card = document.createElement('div');
  card.className = `card ${type}-card`;
  
  // Get activity image URL (placeholder for now)
  const activityImageUrl = 'https://www.bungie.net/common/destiny2_content/icons/68630a6df3143c7b8d80e77d7008f514.jpg';
  
  card.innerHTML = `
    <div class="card-header" style="background-image: url('${activityImageUrl}');">
      <div class="card-title-overlay">
        <h2>${activity.activityName}</h2>
      </div>
    </div>
    <div class="card-body">
      <!-- Row 1: All Clears + Full Clears -->
      <div class="stats-row all-clears-row">
          <div class="all-clears-section">
          <div class="all-clears-label">All Clears</div>
          <div class="dots-container" data-activity="${activity.activityName}" data-type="${type}" data-total="${activity.totalClearsCount || activity.fullClearsCount}">
            <div class="dots-loading">
              <div class="dots-loading-spinner"></div>
              <span>Loading ${activity.totalClearsCount || activity.fullClearsCount} clears...</span>
            </div>
          </div>
        </div>
        <div class="full-clears-section">
          <div class="full-clears-label">Full Clears</div>
          <div class="full-clears-count">${activity.fullClearsCount}</div>
        </div>
      </div>
      
      <!-- Row 2: Time & Sherpa Stats -->
      <div class="stats-row time-stats-row">
        <div class="time-stat">
          <div class="time-stat-label">Fastest</div>
          <div class="time-stat-value">
            <a href="#" data-activity="${activity.activityName}" data-type="fastest">${activity.fastestTime}</a>
          </div>
        </div>
        <div class="time-stat">
          <div class="time-stat-label">Average</div>
          <div class="time-stat-value">
            <a href="#" data-activity="${activity.activityName}" data-type="average">${activity.averageTime}</a>
          </div>
        </div>
        <div class="sherpa-stat">
          <div class="sherpa-stat-label">Sherpas</div>
          <div class="sherpa-stat-value">${activity.sherpasCount}</div>
        </div>
      </div>
      
      <!-- Row 3: Stats (Collapsible) -->
      <div class="stats-row stats-row-section">
        <div class="stats-section-header">
          <div class="stats-section-label">Stats</div>
          <div class="stats-section-toggle">▼</div>
        </div>
        <div class="stats-section-content">
          <div class="stats-list">
            <div class="stat-row-item">
              <div class="stat-label">Kills</div>
              <div class="stat-value">${activity.kills || 0}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Deaths</div>
              <div class="stat-value">${activity.deaths || 0}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Assists</div>
              <div class="stat-value">${activity.assists || 0}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Total Time</div>
              <div class="stat-value">${activity.totalTime || '0:00:00'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 4: Mode Breakdown (Collapsible) -->
      <div class="stats-row mode-breakdown-row">
        <div class="mode-breakdown-header">
          <div class="mode-breakdown-label">Mode Breakdown</div>
          <div class="mode-breakdown-toggle">▼</div>
        </div>
        <div class="mode-breakdown-content">
          <table class="mode-breakdown-table">
            <thead>
              <tr>
                <th>Mode</th>
                <th>Clears</th>
                <th>Fastest</th>
              </tr>
            </thead>
            <tbody>
              ${generateModeBreakdownRows(activity.modeBreakdown, activity.activityName)}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Row 5: Recent Stats (Collapsible) -->
      <div class="stats-row recent-stats-row">
        <div class="recent-stats-header">
          <div class="recent-stats-label">Recent</div>
          <div class="recent-stats-toggle">▼</div>
        </div>
        <div class="recent-stats-content">
          <div class="recent-stats-grid">
            <div class="recent-stat-item">
              <div class="recent-stat-label">Clears (Past Day)</div>
              <div class="recent-stat-value">${activity.recentStats.pastDayClears}</div>
            </div>
            <div class="recent-stat-item">
              <div class="recent-stat-label">Clears (Past Week)</div>
              <div class="recent-stat-value">${activity.recentStats.pastWeekClears}</div>
            </div>
            <div class="recent-stat-item">
              <div class="recent-stat-label">Fastest Time (Today)</div>
              <div class="recent-stat-value">
                ${activity.recentStats.fastestToday 
                  ? `<a href="#" data-activity="${activity.activityName}" data-type="fastest-today">${activity.recentStats.fastestToday}</a>`
                  : 'N/A'}
              </div>
            </div>
            <div class="recent-stat-item">
              <div class="recent-stat-label">Fastest Time (This Week)</div>
              <div class="recent-stat-value">
                ${activity.recentStats.fastestThisWeek 
                  ? `<a href="#" data-activity="${activity.activityName}" data-type="fastest-week">${activity.recentStats.fastestThisWeek}</a>`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 6: Ranks (Collapsible) -->
      <div class="stats-row ranks-row-section">
        <div class="ranks-section-header">
          <div class="ranks-section-label">Ranks</div>
          <div class="ranks-section-toggle">▼</div>
        </div>
        <div class="ranks-section-content">
          <div class="ranks-list">
            <div class="rank-row-item">
              <div class="rank-row-label">Full Clears Rank</div>
              <div class="rank-row-value">
                ${activity.fullClearsRank 
                  ? `<a href="#" data-activity="${activity.activityName}" data-type="full-clears-rank">#${activity.fullClearsRank}</a>`
                  : 'N/A'}
              </div>
            </div>
            <div class="rank-row-item">
              <div class="rank-row-label">Speed Rank</div>
              <div class="rank-row-value">
                ${activity.speedRank 
                  ? `<a href="#" data-activity="${activity.activityName}" data-type="speed-rank">#${activity.speedRank}</a>`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Generate mode breakdown table rows
function generateModeBreakdownRows(modeBreakdown, activityName) {
  if (!modeBreakdown) return '';
  
  let rows = '';
  for (const [mode, stats] of Object.entries(modeBreakdown)) {
    const fastestTime = stats.fastest || 'N/A';
    const isClickable = fastestTime !== 'N/A';
    rows += `
      <tr>
        <td class="mode-name">${mode}</td>
        <td class="mode-clears">${stats.clears}</td>
        <td class="mode-fastest">
          ${isClickable ? `<a href="#" data-activity="${activityName}" data-mode="${mode}" data-type="fastest">${fastestTime}</a>` : fastestTime}
        </td>
      </tr>
    `;
  }
  return rows;
}

// Setup collapsible sections
function setupCollapsibleSections() {
  // Stats sections
  document.querySelectorAll('.stats-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const row = header.closest('.stats-row-section');
      row.classList.toggle('collapsed');
    });
  });
  
  // Ranks sections
  document.querySelectorAll('.ranks-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const row = header.closest('.ranks-row-section');
      row.classList.toggle('collapsed');
    });
  });
  
  // Mode breakdown sections
  document.querySelectorAll('.mode-breakdown-header').forEach(header => {
    header.addEventListener('click', () => {
      const row = header.closest('.mode-breakdown-row');
      row.classList.toggle('collapsed');
    });
  });
  
  // Recent stats sections
  document.querySelectorAll('.recent-stats-header').forEach(header => {
    header.addEventListener('click', () => {
      const row = header.closest('.recent-stats-row');
      row.classList.toggle('collapsed');
    });
  });
}

// Setup lazy loading for dots using Intersection Observer
function setupDotsLazyLoading() {
  const dotsContainers = document.querySelectorAll('.dots-container');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const activityName = container.dataset.activity;
        const activityType = container.dataset.type;
        const key = `${activityType}-${activityName}`;
        
        if (!dotsLoaded.has(key)) {
          loadDotsForActivity(activityName, activityType, container);
          dotsLoaded.add(key);
          observer.unobserve(container); // Stop observing once loaded
        }
      }
    });
  }, {
    rootMargin: '50px' // Start loading slightly before visible
  });
  
  dotsContainers.forEach(container => {
    observer.observe(container);
  });
}

// Load dots data for a specific activity (Phase 2: Lazy Load)
async function loadDotsForActivity(activityName, activityType, container) {
  try {
    // Load clears data if not already loaded
    if (!clearsData) {
      const response = await fetch('player-clears-data.json');
      clearsData = await response.json();
    }
    
    // Get clears for this activity
    const activityTypePlural = activityType === 'raid' ? 'raids' : 'dungeons';
    const activityClears = clearsData.activities[activityTypePlural]?.[activityName] || [];
    
    // Clear loading indicator
    container.innerHTML = '';
    
    // Render dots
    if (activityClears.length === 0) {
      container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.875rem;">No clears</span>';
      return;
    }
    
    // Render dots (for large datasets, consider virtualization)
    activityClears.forEach(clear => {
      const dot = document.createElement('div');
      dot.className = `dot ${clear.completed ? 'completed' : 'incomplete'}`;
      dot.title = clear.completed 
        ? `Completed: ${clear.date}${clear.time ? ` - ${clear.time}` : ''}`
        : `Incomplete: ${clear.date}`;
      dot.dataset.clearId = clear.clearId;
      
      // Click handler (placeholder for future detail pages)
      dot.addEventListener('click', () => {
        // TODO: Navigate to clear detail page
        console.log('Clear clicked:', clear.clearId);
      });
      
      container.appendChild(dot);
    });
  } catch (error) {
    console.error('Error loading dots for activity:', error);
    container.innerHTML = '<span style="color: #ef4444; font-size: 0.875rem;">Error loading clears</span>';
  }
}

// Handle time stat clicks (Fastest Time and Average Time)
document.addEventListener('click', (e) => {
  if (e.target.matches('.time-stat-value a')) {
    e.preventDefault();
    const activityName = e.target.dataset.activity;
    const type = e.target.dataset.type;
    // TODO: Navigate to appropriate leaderboard or detail view
    console.log(`${type} time clicked for ${activityName}`);
  }
  
  // Handle mode breakdown fastest time clicks
  if (e.target.matches('.mode-fastest a')) {
    e.preventDefault();
    const activityName = e.target.dataset.activity;
    const mode = e.target.dataset.mode;
    const type = e.target.dataset.type;
    // TODO: Navigate to appropriate leaderboard or detail view
    console.log(`${type} time clicked for ${activityName} - ${mode}`);
  }
  
  // Handle recent stats fastest time clicks
  if (e.target.matches('.recent-stat-value a')) {
    e.preventDefault();
    const activityName = e.target.dataset.activity;
    const type = e.target.dataset.type;
    // TODO: Navigate to appropriate leaderboard or detail view
    console.log(`${type} clicked for ${activityName}`);
  }
  
  // Handle rank clicks
  if (e.target.matches('.rank-row-value a')) {
    e.preventDefault();
    const activityName = e.target.dataset.activity;
    const type = e.target.dataset.type;
    // TODO: Navigate to appropriate leaderboard
    console.log(`${type} clicked for ${activityName}`);
  }
});

