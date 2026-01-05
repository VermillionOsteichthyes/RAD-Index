// Clan data storage
let clanData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadClanData();
  setupToggle();
  setupClanMembersSection();
});

// Load clan data
async function loadClanData() {
  try {
    const response = await fetch('clan-data.json');
    clanData = await response.json();
    
    // Update clan header
    updateClanHeader();
    
    // Generate clan members
    generateClanMembers();
    
    // Generate activity cards
    generateActivityCards();
  } catch (error) {
    console.error('Error loading clan data:', error);
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

// Update clan header with data
function updateClanHeader() {
  if (!clanData) return;
  
  document.getElementById('clanName').textContent = clanData.name;
  document.getElementById('clanMotto').textContent = clanData.motto;
  document.getElementById('clanBanner').src = clanData.emblemUrl;
  
  // Update Ranks
  const ranks = clanData.ranks;
  
  // Clears Rank
  document.getElementById('clearsRankLabel').textContent = `Clears Rank #${ranks.clearsRank}`;
  document.getElementById('clearsRankCount').textContent = ranks.clearsCount.toLocaleString();
  document.getElementById('clearsRankBubble').className = `rank-bubble ${getRankColorClass(ranks.clearsRank)}`;
  
  // Speed Rank
  document.getElementById('speedRankLabel').textContent = `Speed Rank #${ranks.speedRank}`;
  document.getElementById('speedRankTime').textContent = ranks.speedTime;
  document.getElementById('speedRankBubble').className = `rank-bubble ${getRankColorClass(ranks.speedRank)}`;

  // Sherpa Rank
  document.getElementById('sherpaRankLabel').textContent = `Sherpa Rank #${ranks.sherpaRank}`;
  document.getElementById('sherpaRankCount').textContent = ranks.sherpaCount.toLocaleString();
  document.getElementById('sherpaRankBubble').className = `rank-bubble ${getRankColorClass(ranks.sherpaRank)}`;

  // RAD Time Rank
  document.getElementById('radTimeRankLabel').textContent = `Time in RADs #${ranks.radTimeRank}`;
  document.getElementById('radTimeValue').textContent = ranks.radTime;
  document.getElementById('radTimeRankBubble').className = `rank-bubble ${getRankColorClass(ranks.radTimeRank)}`;

  // Date Founded - Not a rank, but using bubble style
  document.getElementById('dateFoundedLabel').textContent = `Founded`;
  document.getElementById('dateFoundedValue').textContent = clanData.dateFounded;
  document.getElementById('dateFoundedBubble').className = `rank-bubble rank-default`;
}

// Setup Clan Members Section
function setupClanMembersSection() {
    const section = document.getElementById('clanMembersSection');
    const toggle = document.getElementById('clanMembersToggle');
    const titleGroup = document.querySelector('.clan-members-title-group');
    const sortSelect = document.getElementById('memberSortSelect');

    // Toggle collapse
    titleGroup.addEventListener('click', () => {
        section.classList.toggle('collapsed');
    });

    // Sort change
    sortSelect.addEventListener('change', () => {
        generateClanMembers();
    });
}

// Generate Clan Members List
function generateClanMembers() {
    if (!clanData || !clanData.members) return;

    const container = document.getElementById('clanMembersContent');
    const sortValue = document.getElementById('memberSortSelect').value;
    
    // Sort members
    const members = [...clanData.members];
    members.sort((a, b) => {
        switch(sortValue) {
            case 'fullClears':
                return b.fullClears - a.fullClears;
            case 'sherpas':
                return b.sherpas - a.sherpas;
            case 'overallSpeed':
                // Simple string comparison for now, ideally parse time
                return a.overallSpeed.localeCompare(b.overallSpeed); 
            case 'radTime':
                // Simple string comparison for now (e.g. 5000h vs 4500h)
                return parseInt(b.radTime) - parseInt(a.radTime);
            case 'joinDate':
                 return new Date(a.joinDate) - new Date(b.joinDate);
            default:
                return 0;
        }
    });

    container.innerHTML = '';

    members.forEach(member => {
        const card = document.createElement('div');
        card.className = 'member-card';

        let statDisplay = '';
        switch(sortValue) {
            case 'fullClears': statDisplay = `${member.fullClears.toLocaleString()} Clears`; break;
            case 'overallSpeed': statDisplay = `${member.overallSpeed}`; break;
            case 'sherpas': statDisplay = `${member.sherpas} Sherpas`; break;
            case 'radTime': statDisplay = `${member.radTime}`; break;
            case 'joinDate': statDisplay = `Joined: ${member.joinDate}`; break;
        }

        card.innerHTML = `
            <div class="member-emblem-container">
                <img src="${member.emblemUrl}" alt="${member.name}" class="member-emblem">
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-stat">${statDisplay}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Setup Raids/Dungeons toggle
function setupToggle() {
  const toggleCheckbox = document.getElementById('view-toggle');
  
  function updateCardVisibility() {
    const isDungeons = toggleCheckbox.checked;
    const raidCards = document.querySelectorAll('.raid-card');
    const dungeonCards = document.querySelectorAll('.dungeon-card');
    
    if (isDungeons) {
      raidCards.forEach(card => card.style.display = 'none');
      dungeonCards.forEach(card => card.style.display = 'flex');
    } else {
      raidCards.forEach(card => card.style.display = 'flex');
      dungeonCards.forEach(card => card.style.display = 'none');
    }
  }
  
  toggleCheckbox.addEventListener('change', updateCardVisibility);
  // We'll call updateCardVisibility after generating cards
}

// Generate activity cards dynamically
function generateActivityCards() {
  if (!clanData || !clanData.activities) return;
  
  const cardGrid = document.getElementById('cardGrid');
  cardGrid.innerHTML = '';
  
  // Generate raid cards
  clanData.activities.raids.forEach(activity => {
    const card = createActivityCard(activity, 'raid');
    cardGrid.appendChild(card);
  });
  
  // Generate dungeon cards
  clanData.activities.dungeons.forEach(activity => {
    const card = createActivityCard(activity, 'dungeon');
    cardGrid.appendChild(card);
  });
  
  // Re-setup toggle after cards are generated to ensure visibility is correct
  const toggleCheckbox = document.getElementById('view-toggle');
  
  // Helper to force update visibility
    const raidCards = document.querySelectorAll('.raid-card');
    const dungeonCards = document.querySelectorAll('.dungeon-card');
    if (toggleCheckbox.checked) {
        raidCards.forEach(card => card.style.display = 'none');
        dungeonCards.forEach(card => card.style.display = 'flex');
    } else {
        raidCards.forEach(card => card.style.display = 'flex');
        dungeonCards.forEach(card => card.style.display = 'none');
    }

  setupCollapsibleSections();
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
          <!-- No Dots for Clan Page -->
          <div class="stat-value" style="font-size: 2rem;">${(activity.fullClearsCount + 100).toLocaleString()}</div> 
          <!-- Placeholder calculation for total clears, assuming total > full -->
        </div>
        <div class="full-clears-section">
          <div class="full-clears-label">Full Clears</div>
          <div class="full-clears-count">${activity.fullClearsCount.toLocaleString()}</div>
        </div>
      </div>
      
      <!-- Row 2: Time & Sherpa Stats -->
      <div class="stats-row time-stats-row">
        <div class="time-stat">
          <div class="time-stat-label">Fastest</div>
          <div class="time-stat-value">${activity.fastestTime}</div>
        </div>
        <div class="time-stat">
          <div class="time-stat-label">Average</div>
          <div class="time-stat-value">${activity.averageTime}</div>
        </div>
        <div class="sherpa-stat">
          <div class="sherpa-stat-label">Sherpas</div>
          <div class="sherpa-stat-value">${activity.sherpasCount.toLocaleString()}</div>
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
              <div class="stat-value">${(activity.kills || 0).toLocaleString()}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Deaths</div>
              <div class="stat-value">${(activity.deaths || 0).toLocaleString()}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Assists</div>
              <div class="stat-value">${(activity.assists || 0).toLocaleString()}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-label">Total Time</div>
              <div class="stat-value">${activity.totalTime || '0:00:00'}</div>
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
                #${activity.fullClearsRank || 'N/A'}
              </div>
            </div>
            <div class="rank-row-item">
              <div class="rank-row-label">Speed Rank</div>
              <div class="rank-row-value">
                #${activity.speedRank || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return card;
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
}
