let memories = JSON.parse(localStorage.getItem('carLeaseMemories') || '[]');
let currentPhotoData = null;

function goHome() {
    window.location.href = 'index.html';
}

function goConsultation() {
    window.location.href = 'consultation.html';
}

function switchTab(tabName) {
    // タブボタンの切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // タブコンテンツの切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`content-${tabName}`).classList.add('active');
}

function openMemoryModal() {
    document.getElementById('memoryModal').classList.add('active');
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('memoryDate').value = today;
}

function closeMemoryModal() {
    document.getElementById('memoryModal').classList.remove('active');
    // フォームリセット
    document.getElementById('memoryTitle').value = '';
    document.getElementById('memoryDate').value = '';
    document.getElementById('memoryLocation').value = '';
    document.getElementById('memoryNote').value = '';
    document.getElementById('memoryPhoto').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    currentPhotoData = null;
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('photoPreview').style.display = 'inline-block';
            currentPhotoData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removePhoto() {
    document.getElementById('memoryPhoto').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    currentPhotoData = null;
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        const btn = event.target;
        btn.textContent = '取得中...';
        btn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // 簡易的に座標を住所風に表示（実際は逆ジオコーディングが必要）
                const lat = position.coords.latitude.toFixed(4);
                const lng = position.coords.longitude.toFixed(4);
                document.getElementById('memoryLocation').value = `緯度:${lat}, 経度:${lng}`;
                btn.textContent = '📍 現在地を取得';
                btn.disabled = false;
            },
            (error) => {
                alert('位置情報の取得に失敗しました。');
                btn.textContent = '📍 現在地を取得';
                btn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        alert('このブラウザは位置情報に対応していません。');
    }
}

function saveMemory() {
    const title = document.getElementById('memoryTitle').value.trim();
    const date = document.getElementById('memoryDate').value;
    const location = document.getElementById('memoryLocation').value.trim();
    const note = document.getElementById('memoryNote').value.trim();
    
    if (!title) {
        alert('タイトルを入力してください。');
        return;
    }
    if (!date) {
        alert('日付を選択してください。');
        return;
    }
    
    const memory = {
        id: Date.now(),
        title: title,
        date: date,
        location: location,
        note: note,
        photo: currentPhotoData,
        createdAt: new Date().toISOString()
    };
    
    memories.unshift(memory);
    localStorage.setItem('carLeaseMemories', JSON.stringify(memories));
    
    closeMemoryModal();
    renderMemories();
    updateStats();
    
    alert('思い出を保存しました！');
}

function renderMemories() {
    renderTimeline();
    renderGallery();
    renderMap();
}

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    
    if (memories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚗</div>
                <h3>まだ思い出がありません</h3>
                <p>初めてのドライブの写真や場所を記録してみましょう</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = memories.map(memory => {
        const date = new Date(memory.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        return `
            <div class="timeline-item">
                <div class="timeline-header">
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${date}</div>
                </div>
                <div class="timeline-body">
                    <h3 class="timeline-title">${escapeHtml(memory.title)}</h3>
                    ${memory.location ? `
                        <div class="timeline-location">
                            <span>📍</span>
                            <span>${escapeHtml(memory.location)}</span>
                        </div>
                    ` : ''}
                    ${memory.note ? `
                        <p class="timeline-note">${escapeHtml(memory.note).replace(/\n/g, '<br>')}</p>
                    ` : ''}
                    ${memory.photo ? `
                        <img src="${memory.photo}" alt="${escapeHtml(memory.title)}" class="timeline-photo" onclick="openPhotoModal('${memory.photo}', '${escapeHtml(memory.title)} - ${date}')">
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderGallery() {
    const container = document.getElementById('galleryContainer');
    const photos = memories.filter(m => m.photo);
    
    if (photos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📷</div>
                <h3>写真がありません</h3>
                <p>思い出に写真を追加してアルバムを彩りましょう</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = photos.map(memory => {
        const date = new Date(memory.date).toLocaleDateString('ja-JP');
        return `
            <div class="gallery-item" onclick="openPhotoModal('${memory.photo}', '${escapeHtml(memory.title)} (${date})')">
                <img src="${memory.photo}" alt="${escapeHtml(memory.title)}" class="gallery-image">
                <div class="gallery-overlay">
                    <div>${escapeHtml(memory.title)}</div>
                    <div style="font-size: 0.75rem;">${date}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMap() {
    const container = document.getElementById('mapPlaces');
    const locations = memories.filter(m => m.location && !m.location.includes('緯度:'));
    const locationMap = {};
    
    locations.forEach(m => {
        if (!locationMap[m.location]) {
            locationMap[m.location] = 0;
        }
        locationMap[m.location]++;
    });
    
    const locationList = Object.entries(locationMap);
    
    if (locationList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <h3>場所が記録されていません</h3>
                <p>思い出を追加する際に場所を記録してみましょう</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = locationList.map(([location, count]) => `
        <div class="map-place-item">
            <div class="map-place-icon">📍</div>
            <div class="map-place-info">
                <div class="map-place-name">${escapeHtml(location)}</div>
                <div class="map-place-count">${count}回訪問</div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('photoCount').textContent = memories.filter(m => m.photo).length;
    document.getElementById('placeCount').textContent = [...new Set(memories.filter(m => m.location).map(m => m.location))].length;
    document.getElementById('tripCount').textContent = memories.length;
}

function openPhotoModal(photoSrc, info) {
    document.getElementById('enlargedPhoto').src = photoSrc;
    document.getElementById('photoModalInfo').textContent = info;
    document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初期表示
document.addEventListener('DOMContentLoaded', function() {
    renderMemories();
    updateStats();
});
